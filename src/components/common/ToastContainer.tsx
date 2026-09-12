// ==============================================================================
// CONTÊINER DE TOASTS - PLURIX ORGANIZER
// ==============================================================================

import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={18} color="var(--status-success)" />}
          {toast.type === 'error' && <AlertCircle size={18} color="var(--status-danger)" />}
          {toast.type === 'info' && <Info size={18} color="var(--color-accent)" />}

          <div style={{ flex: 1, fontWeight: 500 }}>{toast.message}</div>

          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
