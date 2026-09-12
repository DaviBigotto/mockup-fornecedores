// ==============================================================================
// BARRA LATERAL (SIDEBAR) RECOLHÍVEL - PLURIX ORGANIZER
// Itens de navegação filtrados com base no perfil ativo
// ==============================================================================

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Award,
  PieChart,
  FileText,
  Clock,
  KanbanSquare,
  Building2,
  FileCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { currentUser, activeNav, setActiveNav } = useApp();

  const getMenuItems = () => {
    if (currentUser.role === 'fornecedor') {
      return [
        { id: 'supplier-dashboard', label: 'Painel do Fornecedor', icon: LayoutDashboard },
        { id: 'supplier-wizard', label: 'Cadastro Guiado (Wizard)', icon: FileText },
        { id: 'supplier-documents', label: 'Gestão de Documentos', icon: FileCheck },
        { id: 'supplier-pending', label: 'Pendências e Ajustes', icon: AlertCircle },
        { id: 'supplier-history', label: 'Histórico e Auditoria', icon: Clock },
      ];
    }

    if (currentUser.role === 'compras') {
      return [
        { id: 'procurement-dashboard', label: 'Dashboard da Vendor List', icon: LayoutDashboard },
        { id: 'vendor-list', label: 'Vendor List (Fornecedores)', icon: Users },
        { id: 'procurement-awards', label: 'Fornecedores Premiados', icon: Award },
        { id: 'procurement-coverage', label: 'Cobertura por Categoria', icon: PieChart },
      ];
    }

    // cadastro
    return [
      { id: 'erp-dashboard', label: 'Dashboard Operacional', icon: LayoutDashboard },
      { id: 'erp-queue', label: 'Fila de Solicitações', icon: Building2 },
      { id: 'erp-kanban', label: 'Kanban por Status', icon: KanbanSquare },
      { id: 'vendor-list', label: 'Base de Fornecedores', icon: Users },
      { id: 'erp-history', label: 'Histórico e Auditoria', icon: Clock },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          P
        </div>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.04em', color: '#FFFFFF' }}>
              PLURIX
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600 }}>
              ORGANIZER PORTAL
            </span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {!collapsed && (
          <div
            style={{
              padding: '6px 14px',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.4)',
              letterSpacing: '0.08em',
            }}
          >
            {currentUser?.role === 'fornecedor'
              ? 'Área do Parceiro'
              : currentUser?.role === 'compras'
              ? 'Módulo de Sourcing'
              : 'Governança & Dados'}
          </div>
        )}

        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeNav === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <IconComponent size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
