// ==============================================================================
// PAINEL DE NOTIFICAÇÕES - PLURIX ORGANIZER
// ==============================================================================

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Check, Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead } = useApp();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 8,
        width: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
        border: '1px solid var(--border-subtle)',
        zIndex: 60,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} color="var(--color-primary)" />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
            Central de Notificações
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {notifications.length} avisos
        </span>
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Nenhuma notificação recente.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: notif.isRead ? '#FFFFFF' : '#F0F9FF',
                cursor: 'pointer',
                transition: 'background-color 150ms ease',
                display: 'flex',
                gap: 12,
              }}
            >
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {notif.type === 'error' && <AlertCircle size={16} color="var(--status-danger)" />}
                {notif.type === 'warning' && <AlertTriangle size={16} color="var(--status-warning)" />}
                {notif.type === 'success' && <CheckCircle2 size={16} color="var(--status-success)" />}
                {notif.type === 'info' && <Clock size={16} color="var(--color-accent)" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: notif.isRead ? 600 : 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {notif.title}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>
                    {formatDateTime(notif.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {notif.message}
                </p>
              </div>

              {!notif.isRead && (
                <div style={{ flexShrink: 0, marginTop: 4 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-accent)',
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          backgroundColor: '#F8FAFC',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 11, width: '100%' }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
