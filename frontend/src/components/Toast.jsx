import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { message, type = 'success' } = toast;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle size={18} className="toast-icon text-red-400" />;
      case 'info':
        return <Info size={18} className="toast-icon text-blue-400" />;
      case 'success':
      default:
        return <CheckCircle2 size={18} className="toast-icon text-emerald-400" />;
    }
  };

  return (
    <div className={`toast-container toast-${type}`}>
      <div className="toast-content">
        {getIcon()}
        <span className="toast-message">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="toast-close-btn" aria-label="Close">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
