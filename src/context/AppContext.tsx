// ==============================================================================
// CONTEXTO GLOBAL DA APLICAÇÃO - PLURIX ORGANIZER
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, NotificationItem } from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<User>;
  registerUser: (data: { name: string; email: string; password?: string; role: UserRole; companyName?: string }) => Promise<User>;
  logout: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  
  // Fornecedor Ativo no Portal do Fornecedor
  activeSupplierId: string;
  setActiveSupplierId: (id: string) => void;

  // Detalhes do Fornecedor (Drawer Compras / Geral)
  selectedSupplierId: string | null;
  openSupplierDrawer: (id: string) => void;
  closeSupplierDrawer: () => void;

  // Registro de Fornecedor Premiado
  isAwardModalOpen: boolean;
  awardPreselectedSupplierId: string | null;
  openAwardModal: (supplierId?: string) => void;
  closeAwardModal: () => void;

  // Detalhes da Solicitação ERP (Drawer Time de Cadastro)
  selectedErpRequestId: string | null;
  openErpDrawer: (id: string) => void;
  closeErpDrawer: () => void;
  erpQueueStatusFilter: string;
  setErpQueueStatusFilter: (status: string) => void;

  // Notificações
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  refreshNotifications: () => void;

  // Status do Banco
  dbStatus: { connected: boolean; provider: 'neon' | 'local_fallback'; message: string };
  checkDb: () => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Gatilho para recarregar dados
  dataVersion: number;
  triggerRefresh: () => void;
  resetDemoData: () => Promise<void>;
  wipeCleanData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização de sessão via sessionStorage (começa deslogado por padrão caso não haja sessão)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('plurix_logged_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [activeNav, setActiveNav] = useState<string>('vendor-list');
  const [activeSupplierId, setActiveSupplierId] = useState<string>('');

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardPreselectedSupplierId, setAwardPreselectedSupplierId] = useState<string | null>(null);

  const [selectedErpRequestId, setSelectedErpRequestId] = useState<string | null>(null);
  const [erpQueueStatusFilter, setErpQueueStatusFilter] = useState<string>('Todos');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dataVersion, setDataVersion] = useState(1);

  const [dbStatus, setDbStatus] = useState<{ connected: boolean; provider: 'neon' | 'local_fallback'; message: string }>({
    connected: false,
    provider: 'local_fallback',
    message: 'Verificando conexão...',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerRefresh = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  const checkDb = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.database) {
        setDbStatus(data.database);
      }
    } catch {
      setDbStatus({
        connected: false,
        provider: 'local_fallback',
        message: 'Modo local ativo.',
      });
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?profile=${currentUser.role}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch {
      // noop
    }
  }, [currentUser]);

  useEffect(() => {
    checkDb();
    if (currentUser) {
      refreshNotifications();
    }
  }, [checkDb, refreshNotifications, currentUser]);

  // Sincroniza fornecedor ativo do portal se logado como fornecedor
  useEffect(() => {
    if (currentUser?.role === 'fornecedor') {
      fetch('/api/suppliers')
        .then((res) => res.json())
        .then((data: any[]) => {
          if (Array.isArray(data) && data.length > 0) {
            const matched = data.find((s) => s.contacts?.some((c: any) => c.email?.toLowerCase() === currentUser.email?.toLowerCase()));
            setActiveSupplierId(matched ? matched.id : data[0].id);
          } else {
            setActiveSupplierId('');
          }
        })
        .catch(() => {});
    }
  }, [currentUser, dataVersion]);

  const login = async (email: string, password = '123456', explicitRole?: UserRole): Promise<User> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, role: explicitRole }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Falha na autenticação' }));
        throw new Error(errorData.error || 'Credenciais inválidas');
      }

      const data = await res.json();
      const user: User = data.user;

      setCurrentUser(user);
      sessionStorage.setItem('plurix_logged_user', JSON.stringify(user));

      if (user.role === 'fornecedor') {
        setActiveNav('supplier-dashboard');
      } else if (user.role === 'compras') {
        setActiveNav('vendor-list');
      } else if (user.role === 'cadastro') {
        setActiveNav('erp-queue');
      }

      showToast(`Bem-vindo, ${user.name}! Painel ${user.role.toUpperCase()} acessado.`, 'success');
      triggerRefresh();
      return user;
    } catch (err: any) {
      // Fallback offline caso API esteja indisponível
      const localUser: User = {
        id: `u-${Date.now()}`,
        email: email.trim(),
        name: email.split('@')[0],
        role: explicitRole || 'fornecedor',
        companyName: explicitRole === 'compras' ? 'Plurix Compras' : explicitRole === 'cadastro' ? 'Plurix Governança ERP' : 'Empresa Parceira',
      };
      setCurrentUser(localUser);
      sessionStorage.setItem('plurix_logged_user', JSON.stringify(localUser));

      if (localUser.role === 'fornecedor') {
        setActiveNav('supplier-dashboard');
      } else if (localUser.role === 'compras') {
        setActiveNav('vendor-list');
      } else if (localUser.role === 'cadastro') {
        setActiveNav('erp-queue');
      }

      showToast(`Acesso iniciado como ${localUser.name}.`, 'info');
      triggerRefresh();
      return localUser;
    }
  };

  const registerUser = async (data: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    companyName?: string;
  }): Promise<User> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Erro ao cadastrar usuário' }));
        throw new Error(errData.error || 'Erro no cadastro');
      }

      const resData = await res.json();
      const user: User = resData.user;

      setCurrentUser(user);
      sessionStorage.setItem('plurix_logged_user', JSON.stringify(user));

      if (user.role === 'fornecedor') {
        setActiveNav('supplier-dashboard');
      } else if (user.role === 'compras') {
        setActiveNav('vendor-list');
      } else if (user.role === 'cadastro') {
        setActiveNav('erp-queue');
      }

      showToast(`Conta criada com sucesso! Bem-vindo ao painel, ${user.name}.`, 'success');
      triggerRefresh();
      return user;
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar conta.', 'error');
      throw err;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('plurix_logged_user');
    setActiveNav('vendor-list');
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const openSupplierDrawer = (id: string) => {
    setSelectedSupplierId(id);
  };

  const closeSupplierDrawer = () => {
    setSelectedSupplierId(null);
  };

  const openAwardModal = (supplierId?: string) => {
    setAwardPreselectedSupplierId(supplierId || null);
    setIsAwardModalOpen(true);
  };

  const closeAwardModal = () => {
    setIsAwardModalOpen(false);
    setAwardPreselectedSupplierId(null);
  };

  const openErpDrawer = (id: string) => {
    setSelectedErpRequestId(id);
  };

  const closeErpDrawer = () => {
    setSelectedErpRequestId(null);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch {
      // noop
    }
  };

  const wipeCleanData = async () => {
    try {
      const res = await fetch('/api/wipe-clean', { method: 'POST' });
      if (res.ok) {
        showToast('Banco de dados completamente zerado para início do zero!', 'success');
        setActiveSupplierId('');
        triggerRefresh();
        refreshNotifications();
      } else {
        showToast('Erro ao zerar banco.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao zerar banco.', 'error');
    }
  };

  const resetDemoData = async () => {
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        showToast('Dados restaurados com sucesso no Neon!', 'success');
        triggerRefresh();
        refreshNotifications();
      }
    } catch {
      showToast('Erro ao restaurar dados no banco.', 'error');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        login,
        registerUser,
        logout,
        activeNav,
        setActiveNav,
        activeSupplierId,
        setActiveSupplierId,
        selectedSupplierId,
        openSupplierDrawer,
        closeSupplierDrawer,
        isAwardModalOpen,
        awardPreselectedSupplierId,
        openAwardModal,
        closeAwardModal,
        selectedErpRequestId,
        openErpDrawer,
        closeErpDrawer,
        erpQueueStatusFilter,
        setErpQueueStatusFilter,
        notifications,
        unreadCount,
        markNotificationAsRead,
        refreshNotifications,
        dbStatus,
        checkDb,
        toasts,
        showToast,
        removeToast,
        dataVersion,
        triggerRefresh,
        resetDemoData,
        wipeCleanData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  }
  return context;
}
