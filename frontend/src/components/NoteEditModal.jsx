import React, { useState, useEffect } from 'react';
import { X, Pin, Tag, Save, Copy, Check, Clock, FileText } from 'lucide-react';

export default function NoteEditModal({ note, isOpen, onClose, onSaveUpdate, showToast }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(note.tags || []);
      setIsPinned(Boolean(note.isPinned));
      setTagInput('');
      setCopied(false);
    }
  }, [note]);

  if (!isOpen || !note) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setCopied(true);
        showToast('Copied content to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to copy', 'error');
      });
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim()) {
      showToast('Note content cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      await onSaveUpdate(note._id, {
        title: title.trim(),
        content: content,
        tags: tags,
        isPinned: isPinned,
      });
      showToast('Note updated successfully');
      onClose();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to update note', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="floating-modal-overlay" onClick={onClose}>
      <div
        className="paper-card floating-note-window"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="floating-window-form">
          {/* Header Bar */}
          <div className="floating-window-header">
            <div className="floating-header-left">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`floating-pin-toggle-btn ${isPinned ? 'pin-active' : ''}`}
                title={isPinned ? 'Unpin note' : 'Pin note to top'}
              >
                <Pin size={15} />
                <span>{isPinned ? 'Pinned' : 'Pin Note'}</span>
              </button>
            </div>

            <div className="floating-header-actions">
              <button
                type="button"
                onClick={handleCopy}
                className={`floating-action-btn ${copied ? 'btn-copied' : ''}`}
                title="Copy note content"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="floating-close-btn"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="floating-window-body">
            {/* Title Input */}
            <input
              type="text"
              className="floating-title-input"
              placeholder="Note Title (Optional)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {/* Content Textarea */}
            <textarea
              className="floating-content-textarea"
              placeholder="Type your note or code here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              required
              autoFocus
            />

            {/* Tags section */}
            <div className="floating-tags-section">
              <div className="tags-display">
                {tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove-btn"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <div className="tag-input-wrapper">
                  <Tag size={13} className="tag-icon" />
                  <input
                    type="text"
                    placeholder="Add tag + Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="tag-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="floating-window-footer">
            <div className="floating-stats">
              <span className="stat-item">
                <FileText size={13} />
                {wordCount} {wordCount === 1 ? 'word' : 'words'} ({charCount} chars)
              </span>
              <span className="shortcut-hint-pill">Ctrl + Enter to save</span>
            </div>

            <div className="modal-footer-buttons">
              <button type="button" onClick={onClose} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="paper-btn-primary">
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
