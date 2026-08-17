import React, { useState } from 'react';
import './Login.css';
import { loginApi } from './services/api';
import { Key, Laptop, Smartphone, AlertTriangle } from 'lucide-react';
import logoSvg from './assets/logo.svg';

export default function Login({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Device collision state (if 2 devices active)
  const [limitConflict, setLimitConflict] = useState(null);

  const handlePasswordSubmit = async (e, forceRevokeDeviceId = null) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginApi({
        password,
        forceRevokeDeviceId,
      });

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('activeSessions', JSON.stringify(data.activeSessions || []));
      onLoginSuccess(data.token);
    } catch (err) {
      if (err.limitReached && err.activeSessions) {
        setLimitConflict(err.activeSessions);
      } else {
        setError(err.message || 'Incorrect password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-bg">
      <div className="login-pill-card">
        {/* Top Header: Centered Large Logo & Welcome Title */}
        <div className="login-header-section">
          <div className="login-logo-centered-box">
            <img src={logoSvg} alt="NoteStack Logo" className="login-svg-logo" />
          </div>
          <h2 className="welcome-title">Welcome Vijayashekar</h2>
          <p className="login-tagline">Enter password to unlock NoteStack</p>
        </div>

        {/* 1. Device Conflict Resolver Modal */}
        {limitConflict ? (
          <div className="conflict-card-modal">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle className="text-amber-400" size={20} />
              <h3>Device Limit Reached (2/2)</h3>
            </div>
            <p>Select an active device to disconnect and login with this device:</p>

            {limitConflict.map((session) => {
              const isMobile = /iphone|ipad|android/i.test(session.deviceName);
              return (
                <div key={session.deviceId} className="conflict-device-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isMobile ? <Smartphone size={18} /> : <Laptop size={18} />}
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{session.deviceName}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                        IP: {session.ip || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePasswordSubmit(null, session.deviceId)}
                    className="btn-replace-pill"
                  >
                    Replace
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setLimitConflict(null)}
              className="btn-cancel-link"
            >
              Back to Sign in
            </button>
          </div>
        ) : (
          /* 2. Main Login Form (Matching Reference Image with Password Pill) */
          <form onSubmit={handlePasswordSubmit} className="login-form-group">
            {/* Password Input Pill */}
            <div className="pill-input-wrapper">
              <Key className="pill-input-icon" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoFocus
                className="pill-input-field"
              />
            </div>

            {/* Remember Me */}
            <div className="pill-options-row">
              <label className="remember-me-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="remember-checkbox"
                />
                <span>Remember Me</span>
              </label>
            </div>

            {/* Sign In Button Pill */}
            <button
              type="submit"
              disabled={loading}
              className="pill-signin-btn"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {error && <div className="login-pill-error">{error}</div>}
          </form>
        )}

        {/* Footer */}
        <footer className="login-pill-footer">
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
      </div>
    </div>
  );
}