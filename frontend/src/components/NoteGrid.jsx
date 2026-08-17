import React, { useState, useEffect, useRef } from 'react';
import NoteCard from './NoteCard';
import { StickyNote, Search, Pin, Layers, Loader2 } from 'lucide-react';

const INITIAL_BATCH_SIZE = 12;
const BATCH_INCREMENT = 12;

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
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const observerTarget = useRef(null);

  // Reset pagination on search / filter changes
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [searchQuery, selectedTag, notes.length]);

  // IntersectionObserver for lazy loading more notes on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < notes.length) {
          setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, notes.length));
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [visibleCount, notes.length]);

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

  // Slice visible notes for lazy loading
  const visibleNotes = notes.slice(0, visibleCount);
  const pinnedNotes = visibleNotes.filter((n) => n.isPinned);
  const otherNotes = visibleNotes.filter((n) => !n.isPinned);

  const totalPinned = notes.filter((n) => n.isPinned).length;
  const hasMore = visibleCount < notes.length;

  return (
    <div className="notes-container">
      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="notes-section">
          <div className="section-header">
            <div className="section-title-badge pinned-section-badge">
              <Pin size={13} className="pin-fill-icon" />
              <span>Pinned Notes</span>
              <span className="section-count-pill">{totalPinned}</span>
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
              <span className="section-count-pill">{notes.length - totalPinned}</span>
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

      {/* Lazy Loading Sentinel Target */}
      <div ref={observerTarget} className="lazy-scroll-sentinel">
        {hasMore && (
          <div className="lazy-load-indicator">
            <Loader2 size={18} className="spinner-icon" />
            <span>Loading more notes ({visibleCount} of {notes.length})...</span>
          </div>
        )}
      </div>
    </div>
  );
}
