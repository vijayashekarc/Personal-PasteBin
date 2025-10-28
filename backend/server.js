const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- NEW IMPORTS ---
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// --- END NEW IMPORTS ---

const Snippet = require('./models/Snippet');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION (Same as before) ---
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

// --- NEW AUTHENTICATION ROUTE ---

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    // Compare submitted password with the hashed password in .env
    const isMatch = await bcrypt.compare(password, process.env.PAGE_PASSWORD_HASH);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Password is correct! Create a token.
    const token = jwt.sign(
      { access: 'granted' }, // Payload
      process.env.JWT_SECRET,   // Your secret key
      { expiresIn: '7d' }        // Token expires in 7 days
    );

    // Send the token back to the frontend
    res.json({ token });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// --- NEW PROTECTION MIDDLEWARE ---
// This function will run before any API route it's applied to
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Token is sent as "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401); // Unauthorized (no token)
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden (invalid token)
    }
    req.user = user;
    next(); // Token is valid, proceed to the API route
  });
};

// --- UPDATED API ROUTES ---
// We add 'verifyToken' as the second argument.
// Now, a user *must* have a valid token to access these routes.

// GET: Fetch all snippets
app.get('/api/snippets', verifyToken, async (req, res) => {
  // ... (rest of your route logic is unchanged)
  try {
    const snippets = await Snippet.find().sort({ createdAt: -1 });
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: Create a new snippet
app.post('/api/snippets', verifyToken, async (req, res) => {
  // ... (rest of your route logic is unchanged)
  if (!req.body.text || req.body.text.trim() === '') {
    return res.status(400).json({ message: 'Snippet text cannot be empty' });
  }
  const newSnippet = new Snippet({ text: req.body.text });
  try {
    const savedSnippet = await newSnippet.save();
    res.status(201).json(savedSnippet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE: Delete a snippet
app.delete('/api/snippets/:id', verifyToken, async (req, res) => {
  // ... (rest of your route logic is unchanged)
  try {
    const { id } = req.params;
    const deletedSnippet = await Snippet.findByIdAndDelete(id);
    if (!deletedSnippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    res.json({ message: 'Snippet deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});