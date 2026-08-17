import React from 'react';
import NoteCard from './NoteCard';
import { StickyNote, Search, Pin, Layers } from 'lucide-react';

export default function NoteGrid({
  notes = [],
  loading,
  searchQuery,
  selectedTag,
  onTogglePin,
  onEdit,
  onDelete,
  showToast,
}) {
  if (loading) {
    return (
      <div className="empty-state-card">
        <div className="spinner"></div>
        <p>Loading your private notes...</p>
      </div>
    );
  }

  if (notes.length === 0) {
    if (searchQuery || selectedTag) {
      return (
        <div className="paper-card empty-state-card">
          <Search size={36} className="empty-icon text-gray-500" />
          <h3>No matching notes found</h3>
          <p>Try adjusting your search query or removing the tag filter.</p>
        </div>
      );
    }

    return (
      <div className="paper-card empty-state-card">
        <StickyNote size={40} className="empty-icon text-blue-400" />
        <h3>Your private vault is empty</h3>
        <p>Use the box above or paste from clipboard (Ctrl+Enter) to save your first private note.</p>
      </div>
    );
  }

  // Separate pinned and regular notes
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  return (
    <div className="notes-container">
      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="notes-section">
          <div className="section-header">
            <div className="section-title-badge pinned-section-badge">
              <Pin size={13} className="pin-fill-icon" />
              <span>Pinned Notes</span>
              <span className="section-count-pill">{pinnedNotes.length}</span>
            </div>
          </div>
          <div className="notes-grid">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onTogglePin={onTogglePin}
                onEdit={onEdit}
                onDelete={onDelete}
                showToast={showToast}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Other Notes Section */}
      <div className="notes-section">
        {pinnedNotes.length > 0 && (
          <div className="section-header">
            <div className="section-title-badge">
              <Layers size={13} />
              <span>All Notes</span>
              <span className="section-count-pill">{otherNotes.length}</span>
            </div>
          </div>
        )}
        <div className="notes-grid">
          {otherNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onTogglePin={onTogglePin}
              onEdit={onEdit}
              onDelete={onDelete}
              showToast={showToast}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
