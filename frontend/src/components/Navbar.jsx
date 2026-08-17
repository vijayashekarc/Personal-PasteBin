import React from 'react';
import { Search, Laptop, LogOut, X, Sun, Moon, ShieldCheck } from 'lucide-react';
import logoSvg from '../assets/logo.svg';

export default function Navbar({
  searchQuery,
  setSearchQuery,
  activeSessionsCount,
  maxSessions = 2,
  theme,
  onToggleTheme,
  onOpenDeviceModal,
  onLogout,
}) {
  const isMaxReached = activeSessionsCount >= maxSessions;

  return (
    <header className="ceramic-navbar">
      <div className="ceramic-nav-inner">
        {/* Brand Group */}
        <div className="nav-brand-group">
          <div className="brand-logo-frame">
            <img src={logoSvg} alt="NoteStack" className="brand-logo-img" />
          </div>
          <div className="brand-titles">
            <span className="brand-title">NoteStack</span>
            <span className="brand-status-tag">Vault</span>
          </div>
        </div>

        {/* Floating Ceramic Search Bar */}
        <div className="nav-search-container">
          <div className="ceramic-search-pill">
            <Search size={16} className="search-pill-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, tags, code..."
              aria-label="Search notes"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="search-clear-pill-btn"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="nav-controls-group">
          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="ceramic-icon-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-amber-400 theme-icon" />
            ) : (
              <Moon size={17} className="text-sky-600 theme-icon" />
            )}
          </button>

          {/* Connected Device Status Badge */}
          <button
            onClick={onOpenDeviceModal}
            className={`ceramic-status-pill ${isMaxReached ? 'pill-warning' : 'pill-active'}`}
            title="View connected devices"
          >
            <span className={`live-pulse-dot ${isMaxReached ? 'pulse-amber' : 'pulse-green'}`} />
            <Laptop size={14} />
            <span className="pill-count-label">
              {activeSessionsCount || 1}/{maxSessions}
            </span>
          </button>

          {/* Logout Button */}
          <button onClick={onLogout} className="ceramic-logout-btn" title="Sign Out">
            <LogOut size={15} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
