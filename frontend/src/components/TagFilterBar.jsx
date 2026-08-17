import React from 'react';
import { Tag, Sparkles } from 'lucide-react';

export default function TagFilterBar({ tags = [], selectedTag, onSelectTag, totalNotesCount }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="glass-filter-bar">
      <div className="filter-label">
        <Tag size={14} className="text-gray-400" />
        <span>Tags:</span>
      </div>

      <div className="filter-chips-list">
        <button
          onClick={() => onSelectTag(null)}
          className={`filter-chip ${selectedTag === null ? 'chip-active' : ''}`}
        >
          All
          <span className="chip-count">{totalNotesCount}</span>
        </button>

        {tags.map(({ name, count }) => (
          <button
            key={name}
            onClick={() => onSelectTag(selectedTag === name ? null : name)}
            className={`filter-chip ${selectedTag === name ? 'chip-active' : ''}`}
          >
            #{name}
            <span className="chip-count">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
