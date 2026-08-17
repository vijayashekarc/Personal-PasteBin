import React, { useState, useEffect } from 'react';
import { Laptop, Smartphone, X, Trash2 } from 'lucide-react';
import { getSessionsApi, deleteSessionApi } from '../services/api';

export default function DeviceManagerModal({ token, isOpen, onClose, onSessionChanged, showToast }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessionsApi(token);
      setSessions(data);
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (deviceId, deviceName) => {
    if (!window.confirm(`Are you sure you want to disconnect ${deviceName || 'this device'}?`)) {
      return;
    }
    try {
      await deleteSessionApi(deviceId, token);
      showToast('Device disconnected successfully');
      loadSessions();
      if (onSessionChanged) onSessionChanged();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div className="glass-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Laptop className="modal-icon" size={22} />
            <div>
              <h3>Connected Devices</h3>
              <p className="modal-subtitle">
                Maximum 2 devices allowed simultaneously ({sessions.length}/2 Active)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="glass-icon-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">Loading active sessions...</div>
          ) : (
            <div className="device-list">
              {sessions.map((session) => {
                const isMobile = /iphone|ipad|android/i.test(session.deviceName);
                return (
                  <div
                    key={session.deviceId}
                    className={`device-card ${session.isCurrent ? 'current-device-card' : ''}`}
                  >
                    <div className="device-info-left">
                      <div className="device-type-icon">
                        {isMobile ? <Smartphone size={20} /> : <Laptop size={20} />}
                      </div>
                      <div className="device-details">
                        <div className="device-name-row">
                          <span className="device-name">{session.deviceName}</span>
                          {session.isCurrent && (
                            <span className="badge-this-device">This Device</span>
                          )}
                        </div>
                        <div className="device-meta">
                          <span>IP: {session.ip || 'Unknown'}</span>
                          <span>•</span>
                          <span>
                            Last active: {new Date(session.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="device-actions">
                      {!session.isCurrent ? (
                        <button
                          onClick={() => handleRevokeSession(session.deviceId, session.deviceName)}
                          className="btn-revoke"
                          title="Disconnect this device"
                        >
                          <Trash2 size={14} />
                          <span>Disconnect</span>
                        </button>
                      ) : (
                        <span className="active-now-badge">Active</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
