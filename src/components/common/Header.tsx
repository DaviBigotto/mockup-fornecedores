// ==============================================================================
// CABEÇALHO EXECUTIVO - PLURIX ORGANIZER
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Bell, User, LogOut, ChevronDown, Shield, Sparkles } from 'lucide-react';
import { NotificationsPopover } from './NotificationsPopover';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { currentUser, unreadCount, logout } = useApp();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleLabel = () => {
    if (!currentUser) return 'Visitante';
    switch (currentUser.role) {
      case 'fornecedor':
        return 'Portal do Fornecedor';
      case 'compras':
        return 'Área de Compras';
      case 'cadastro':
        return 'Time de Governança & ERP';
      default:
        return 'Usuário';
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          onClick={toggleSidebar}
          className="btn btn-ghost"
          style={{ padding: 8, color: 'var(--text-secondary)' }}
          title="Alternar barra lateral"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                background: 'var(--color-primary)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 14,
                padding: '4px 8px',
                borderRadius: 4,
                letterSpacing: '0.05em',
              }}
            >
              PLURIX
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              Organizer
            </span>
            <span style={{ color: 'var(--border-medium)', fontSize: 13 }}>|</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
              Módulo de Fornecedores
            </span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Central de Notificações */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsNotifOpen((v) => !v)}
            className="btn btn-ghost"
            style={{
              padding: 8,
              position: 'relative',
              color: isNotifOpen ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
            title="Notificações"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'var(--color-danger)',
                  color: '#FFFFFF',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  minWidth: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && <NotificationsPopover onClose={() => setIsNotifOpen(false)} />}
        </div>

        {/* Divisor */}
        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Perfil do Usuário Ativo */}
        {currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '4px 8px',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 13,
                border: '1px solid var(--border-subtle)',
              }}
            >
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentUser.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 4,
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                  }}
                >
                  {getRoleLabel()}
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {currentUser.email}
              </span>
            </div>

            {/* Botão Sair / Trocar de Perfil */}
            <button
              type="button"
              onClick={logout}
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginLeft: 8,
                borderRadius: 6,
                border: '1px solid var(--border-medium)',
              }}
              title="Encerrar sessão e voltar ao Hub de Acessos / Trocar de Painel"
            >
              <LogOut size={14} color="var(--color-danger)" />
              <span>Sair / Trocar Painel</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
