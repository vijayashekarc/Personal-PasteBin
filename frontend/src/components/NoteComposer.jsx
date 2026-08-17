import React, { useState } from 'react';
import { Plus, Pin, Clipboard, Tag, X, Sparkles, Send } from 'lucide-react';

export default function NoteComposer({ onSaveNote, showToast }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContent((prev) => (prev ? prev + '\n' + text : text));
        setIsExpanded(true);
        showToast('Pasted from clipboard');
      }
    } catch (err) {
      console.error(err);
      showToast('Clipboard access denied or unsupported', 'error');
    }
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

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim()) {
      showToast('Please enter note content', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveNote({
        title: title.trim(),
        content: content,
        tags: tags,
        isPinned: isPinned,
      });

      // Reset form
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      setIsPinned(false);
      setIsExpanded(false);
      showToast('Note saved successfully');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to save note', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="paper-card composer-card">
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        {/* Title and Pin Toggle */}
        <div className="composer-header">
          <input
            type="text"
            className="composer-title-input"
            placeholder="Title (optional)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
          />
          <button
            type="button"
            className={`btn-pin-toggle ${isPinned ? 'pin-active' : ''}`}
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="composer-body">
          <textarea
            className="composer-textarea"
            placeholder="Write a note, paste snippets, code, credentials, or links..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            rows={isExpanded ? 5 : 3}
            required
          />
        </div>

        {/* Tags & Controls when expanded */}
        {isExpanded && (
          <div className="composer-tags-section">
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
        )}

        {/* Action Buttons */}
        <div className="composer-footer">
          <div className="composer-footer-left">
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="paper-btn-secondary"
              title="Paste content from clipboard"
            >
              <Clipboard size={14} />
              <span>Paste Clipboard</span>
            </button>
          </div>

          <div className="composer-footer-right">
            <span className="shortcut-hint">Ctrl + Enter</span>
            <button
              type="submit"
              disabled={isSaving || !content.trim()}
              className="paper-btn-primary"
            >
              <Send size={14} />
              <span>{isSaving ? 'Saving...' : 'Save Note'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
