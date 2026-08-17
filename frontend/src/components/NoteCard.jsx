import React, { useState } from 'react';
import { Copy, Check, Pin, Edit3, Trash2, Clock } from 'lucide-react';

export default function NoteCard({ note, onTogglePin, onEdit, onDelete, showToast }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(note.content)
      .then(() => {
        setCopied(true);
        showToast('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to copy', 'error');
      });
  };

  const handlePinClick = (e) => {
    e.stopPropagation();
    onTogglePin(note._id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(note._id);
  };

  const handleCardClick = () => {
    onEdit(note);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const noteColor = note.color || 'default';

  return (
    <div
      onClick={handleCardClick}
      className={`paper-card note-card note-card-theme-${noteColor} ${note.isPinned ? 'note-card-pinned' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      title="Click or tap to view / edit in floating window"
    >
      {/* Top Header */}
      <div className="note-card-header">
        <div className="note-title-wrapper">
          {note.isPinned && (
            <span className="pinned-badge-chip">
              <Pin size={11} className="pin-fill-icon" />
              <span>Pinned</span>
            </span>
          )}
          <h3 className="note-title">{note.title || 'Untitled Note'}</h3>
        </div>

        <div className="note-header-actions" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handlePinClick}
            className={`btn-icon-subtle ${note.isPinned ? 'pin-btn-active' : ''}`}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
            aria-label="Toggle pin"
          >
            <Pin size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            className="btn-icon-subtle"
            title="Expand & edit note"
            aria-label="Edit note"
          >
            <Edit3 size={15} />
          </button>
          <button
            onClick={handleDeleteClick}
            className="btn-icon-subtle btn-delete-hover"
            title="Delete note"
            aria-label="Delete note"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Note Content Preview */}
      <div className="note-card-body">
        <pre className="note-content-text">{note.content}</pre>
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="note-card-tags">
          {note.tags.map((tag) => (
            <span key={tag} className="note-tag-badge">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="note-card-footer" onClick={(e) => e.stopPropagation()}>
        <span className="note-timestamp">
          <Clock size={12} />
          {formatDate(note.updatedAt || note.createdAt)}
        </span>

        <button
          onClick={handleCopy}
          className={`btn-copy-action ${copied ? 'copied-active' : ''}`}
          title="Copy content"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
