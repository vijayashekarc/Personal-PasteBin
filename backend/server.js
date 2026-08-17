const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Snippet = require('./models/Snippet');
const Note = require('./models/Note');
const DeviceSession = require('./models/DeviceSession');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB!");
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err.message);
    process.exit(1);
  });

// Clean client IP helper
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '';
};

// --- AUTH ROUTES ---

// POST /auth/login
// Supports device session tracking, 2-device maximum limit, and force replacement
app.post('/auth/login', async (req, res) => {
  const { password, deviceId, deviceName, forceRevokeDeviceId } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const isMatch = await bcrypt.compare(password, process.env.PAGE_PASSWORD_HASH);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const clientDeviceId = deviceId || `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const clientDeviceName = deviceName || 'Web Browser';
    const clientIp = getClientIp(req);

    // If user requested to force revoke an existing device session
    if (forceRevokeDeviceId) {
      await DeviceSession.deleteOne({ deviceId: forceRevokeDeviceId });
    }

    // Check active sessions in MongoDB
    const activeSessions = await DeviceSession.find().sort({ lastActive: -1 });
    const existingSessionForDevice = activeSessions.find(s => s.deviceId === clientDeviceId);

    // If device is not already registered and there are already 2 active devices
    if (!existingSessionForDevice && activeSessions.length >= 2) {
      return res.status(409).json({
        message: 'Device limit reached. Maximum 2 devices are allowed simultaneously.',
        limitReached: true,
        activeSessions: activeSessions.map(s => ({
          deviceId: s.deviceId,
          deviceName: s.deviceName,
          ip: s.ip,
          lastActive: s.lastActive,
          createdAt: s.createdAt,
        })),
      });
    }

    // Create JWT Token
    const token = jwt.sign(
      { access: 'granted', deviceId: clientDeviceId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Save or update session in DB
    await DeviceSession.findOneAndUpdate(
      { deviceId: clientDeviceId },
      {
        deviceId: clientDeviceId,
        deviceName: clientDeviceName,
        ip: clientIp,
        token: token,
        lastActive: new Date(),
      },
      { upsert: true, new: true }
    );

    const updatedSessions = await DeviceSession.find().sort({ lastActive: -1 });

    res.json({
      token,
      deviceId: clientDeviceId,
      activeSessions: updatedSessions.map(s => ({
        deviceId: s.deviceId,
        deviceName: s.deviceName,
        ip: s.ip,
        lastActive: s.lastActive,
        createdAt: s.createdAt,
        isCurrent: s.deviceId === clientDeviceId,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- SESSION-AWARE AUTH MIDDLEWARE ---
const verifySessionAndToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const deviceId = req.headers['x-device-id'];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const effectiveDeviceId = deviceId || decoded.deviceId;

    if (effectiveDeviceId) {
      try {
        const session = await DeviceSession.findOne({ deviceId: effectiveDeviceId });
        if (!session) {
          return res.status(401).json({
            message: 'Session has been revoked or logged out remotely',
            sessionRevoked: true,
          });
        }
        // Update heartbeat / lastActive
        session.lastActive = new Date();
        await session.save();
      } catch (dbErr) {
        console.error('Error updating session heartbeat:', dbErr);
      }
    }

    req.user = decoded;
    req.deviceId = effectiveDeviceId;
    next();
  });
};

// --- SESSION MANAGEMENT ROUTES ---

// GET /auth/sessions
app.get('/auth/sessions', verifySessionAndToken, async (req, res) => {
  try {
    const sessions = await DeviceSession.find().sort({ lastActive: -1 });
    res.json(
      sessions.map(s => ({
        deviceId: s.deviceId,
        deviceName: s.deviceName,
        ip: s.ip,
        lastActive: s.lastActive,
        createdAt: s.createdAt,
        isCurrent: s.deviceId === req.deviceId,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /auth/sessions/:deviceId
app.delete('/auth/sessions/:deviceId', verifySessionAndToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    await DeviceSession.deleteOne({ deviceId });
    res.json({ message: 'Device session revoked successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/logout
app.post('/auth/logout', verifySessionAndToken, async (req, res) => {
  try {
    if (req.deviceId) {
      await DeviceSession.deleteOne({ deviceId: req.deviceId });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NOTES CRUD API ROUTES ---

// GET /api/notes (Search, filter, order by pinned then updatedAt)
app.get('/api/notes', verifySessionAndToken, async (req, res) => {
  try {
    const { q, tag } = req.query;
    const filter = {};

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex },
      ];
    }

    if (tag && tag.trim()) {
      filter.tags = tag.trim();
    }

    let notes = await Note.find(filter).sort({ isPinned: -1, updatedAt: -1 });

    // Fallback migration: If notes collection is empty, check legacy Snippets
    if (notes.length === 0 && !q && !tag) {
      const snippets = await Snippet.find().sort({ createdAt: -1 });
      if (snippets.length > 0) {
        const migratedNotes = await Promise.all(
          snippets.map(s =>
            Note.create({
              title: s.text.slice(0, 30).split('\n')[0] || 'Untitled Note',
              content: s.text,
              tags: [],
              isPinned: false,
              createdAt: s.createdAt,
              updatedAt: s.createdAt,
            })
          )
        );
        notes = migratedNotes;
      }
    }

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notes (Create Note)
app.post('/api/notes', verifySessionAndToken, async (req, res) => {
  const { title, content, tags, isPinned, color } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Note content cannot be empty' });
  }

  try {
    const cleanTags = Array.isArray(tags)
      ? tags.map(t => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const newNote = new Note({
      title: (title || '').trim(),
      content: content,
      tags: cleanTags,
      isPinned: Boolean(isPinned),
      color: color || 'default',
    });

    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/notes/:id (Update Note)
app.put('/api/notes/:id', verifySessionAndToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, tags, isPinned, color } = req.body;

  if (content !== undefined && content.trim() === '') {
    return res.status(400).json({ message: 'Note content cannot be empty' });
  }

  try {
    const updateData = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags)
        ? tags.map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];
    }
    if (isPinned !== undefined) updateData.isPinned = Boolean(isPinned);
    if (color !== undefined) updateData.color = color;

    const updatedNote = await Note.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(updatedNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/notes/:id/pin (Toggle Pin)
app.patch('/api/notes/:id/pin', verifySessionAndToken, async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    note.isPinned = !note.isPinned;
    note.updatedAt = new Date();
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notes/:id (Delete Note)
app.delete('/api/notes/:id', verifySessionAndToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- LEGACY SNIPPETS ROUTE SUPPORT ---
app.get('/api/snippets', verifySessionAndToken, async (req, res) => {
  try {
    const notes = await Note.find().sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes.map(n => ({ _id: n._id, text: n.content, createdAt: n.createdAt })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/snippets', verifySessionAndToken, async (req, res) => {
  if (!req.body.text || req.body.text.trim() === '') {
    return res.status(400).json({ message: 'Snippet text cannot be empty' });
  }
  try {
    const newNote = new Note({
      title: req.body.text.slice(0, 30).split('\n')[0] || 'Snippet',
      content: req.body.text,
    });
    const saved = await newNote.save();
    res.status(201).json({ _id: saved._id, text: saved.content, createdAt: saved.createdAt });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/snippets/:id', verifySessionAndToken, async (req, res) => {
  try {
    const { id } = req.params;
    await Note.findByIdAndDelete(id);
    res.json({ message: 'Snippet deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});