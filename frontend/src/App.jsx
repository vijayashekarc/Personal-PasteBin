import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import NoteComposer from './components/NoteComposer';
import TagFilterBar from './components/TagFilterBar';
import NoteGrid from './components/NoteGrid';
import Toast from './components/Toast';
import {
  getNotesApi,
  createNoteApi,
  updateNoteApi,
  togglePinApi,
  deleteNoteApi,
  getSessionsApi,
  logoutApi,
} from './services/api';

// Lazy loaded components for optimized bundle performance
const Login = lazy(() => import('./Login'));
const NoteEditModal = lazy(() => import('./components/NoteEditModal'));
const DeviceManagerModal = lazy(() => import('./components/DeviceManagerModal'));

function App() {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [theme, setTheme] = useState(() => localStorage.getItem('pastebin_theme') || 'light');
  
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  
  const [activeSessionsCount, setActiveSessionsCount] = useState(1);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [toast, setToast] = useState(null);

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pastebin_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Helper for displaying toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current && current.message === message ? null : current));
    }, 3000);
  }, []);

  const handleLogout = useCallback(async () => {
    if (token) {
      await logoutApi(token);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeSessions');
    setToken(null);
    setNotes([]);
    setDeviceModalOpen(false);
  }, [token]);

  // Load active sessions count
  const loadSessionsCount = useCallback(async () => {
    if (!token) return;
    try {
      const sessions = await getSessionsApi(token);
      if (Array.isArray(sessions)) {
        setActiveSessionsCount(sessions.length);
      }
    } catch (err) {
      if (err.message && (err.message.includes('revoked') || err.message.includes('401'))) {
        showToast('Your session was revoked remotely', 'error');
        handleLogout();
      }
    }
  }, [token, handleLogout, showToast]);

  // Load notes
  const loadNotes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getNotesApi({ q: searchQuery, tag: selectedTag }, token);
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
      if (err.status === 401 || err.sessionRevoked) {
        showToast('Session expired or revoked from another device', 'error');
        handleLogout();
      } else {
        showToast(err.message || 'Failed to load notes', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, selectedTag, handleLogout, showToast]);

  // Fetch notes on dependency changes
  useEffect(() => {
    if (token) {
      loadNotes();
      loadSessionsCount();
    }
  }, [token, searchQuery, selectedTag, loadNotes, loadSessionsCount]);

  // Periodic heartbeat for sessions count
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(loadSessionsCount, 30000);
    return () => clearInterval(interval);
  }, [token, loadSessionsCount]);

  // Calculate unique tags with counts across all notes
  const allTagsWithCounts = useMemo(() => {
    const counts = {};
    notes.forEach((note) => {
      if (Array.isArray(note.tags)) {
        note.tags.forEach((tag) => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [notes]);

  // Note CRUD actions
  const handleSaveNote = async (newNoteData) => {
    const saved = await createNoteApi(newNoteData, token);
    setNotes((prev) => [saved, ...prev]);
    loadSessionsCount();
  };

  const handleSaveUpdate = async (id, updatedData) => {
    const saved = await updateNoteApi(id, updatedData, token);
    setNotes((prev) => prev.map((n) => (n._id === id ? saved : n)));
  };

  const handleTogglePin = async (id) => {
    try {
      const updated = await togglePinApi(id, token);
      setNotes((prev) => {
        const next = prev.map((n) => (n._id === id ? updated : n));
        return next.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      });
      showToast(updated.isPinned ? 'Pinned note' : 'Unpinned note');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteNoteApi(id, token);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      showToast('Note deleted');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!token) {
    return (
      <Suspense fallback={<div className="loading-fallback"><div className="spinner"></div></div>}>
        <Login
          onLoginSuccess={(newToken) => {
            setToken(newToken);
          }}
        />
      </Suspense>
    );
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeSessionsCount={activeSessionsCount}
        maxSessions={2}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenDeviceModal={() => setDeviceModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content-container">
        {/* Note Composer: Automatically hidden when user is actively searching */}
        {!isSearching && (
          <NoteComposer onSaveNote={handleSaveNote} showToast={showToast} />
        )}

        {/* Tag Filter Bar */}
        <TagFilterBar
          tags={allTagsWithCounts}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          totalNotesCount={notes.length}
        />

        {/* Notes Grid with Progressive Lazy Loading */}
        <NoteGrid
          notes={notes}
          loading={loading}
          searchQuery={searchQuery}
          selectedTag={selectedTag}
          onTogglePin={handleTogglePin}
          onEdit={(note) => setEditingNote(note)}
          onDelete={handleDeleteNote}
          showToast={showToast}
        />
      </main>

      {/* App Footer */}
      <footer className="app-footer">
        <p>
          Developed by Vijayashekar |{' '}
          <a
            href="https://github.com/vijayashekarc/Personal-PasteBin"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>

      {/* Lazy Loaded Modals with Suspense */}
      <Suspense fallback={null}>
        {editingNote && (
          <NoteEditModal
            note={editingNote}
            isOpen={Boolean(editingNote)}
            onClose={() => setEditingNote(null)}
            onSaveUpdate={handleSaveUpdate}
            showToast={showToast}
          />
        )}

        {deviceModalOpen && (
          <DeviceManagerModal
            token={token}
            isOpen={deviceModalOpen}
            onClose={() => setDeviceModalOpen(false)}
            onSessionChanged={loadSessionsCount}
            showToast={showToast}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;