// ==============================================================================
// APLICAÇÃO PRINCIPAL - PLURIX ORGANIZER (MÓDULO DE FORNECEDORES)
// Shell corporativo com autenticação, navegação entre perfis, modais e drawers
// ==============================================================================

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginPage } from './pages/auth/LoginPage';

// Páginas do Perfil Fornecedor
import { SupplierDashboard } from './pages/supplier/SupplierDashboard';
import { SupplierPreRegistration } from './pages/supplier/SupplierPreRegistration';
import { SupplierWizard } from './pages/supplier/SupplierWizard';
import { SupplierDocuments } from './pages/supplier/SupplierDocuments';
import { SupplierPending } from './pages/supplier/SupplierPending';
import { SupplierHistory } from './pages/supplier/SupplierHistory';

// Páginas do Perfil Compras
import { ProcurementDashboard } from './pages/procurement/ProcurementDashboard';
import { VendorList } from './pages/procurement/VendorList';
import { ProcurementAwards } from './pages/procurement/ProcurementAwards';
import { ProcurementCoverage } from './pages/procurement/ProcurementCoverage';
import { SupplierDrawer } from './pages/procurement/SupplierDrawer';
import { AwardSupplierModal } from './pages/procurement/AwardSupplierModal';

// Páginas do Perfil Cadastro / ERP
import { ErpDashboard } from './pages/erp/ErpDashboard';
import { ErpQueue } from './pages/erp/ErpQueue';
import { ErpKanban } from './pages/erp/ErpKanban';
import { ErpHistory } from './pages/erp/ErpHistory';
import { ErpRequestDrawer } from './pages/erp/ErpRequestDrawer';

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated, activeNav, setActiveNav } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Se o usuário não estiver autenticado e não estiver na tela pública de pré-cadastro
  if (!isAuthenticated && activeNav !== 'public-prereg') {
    return (
      <>
        <LoginPage onNavigateToPreReg={() => setActiveNav('public-prereg')} />
        <ToastContainer />
      </>
    );
  }

  // Se o usuário estiver na tela pública de pré-cadastro (sem login prévio)
  if (!isAuthenticated && activeNav === 'public-prereg') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '24px 16px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: 'var(--color-primary)', color: '#FFFFFF', fontWeight: 900, fontSize: 13, padding: '3px 8px', borderRadius: 4 }}>
              PLURIX
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Portal de Onboarding</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveNav('login')}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            ← Voltar ao Acesso
          </button>
        </div>
        <SupplierPreRegistration />
        <ToastContainer />
      </div>
    );
  }

  // Usuário autenticado: renderiza tela de acordo com o perfil
  const renderContent = () => {
    switch (activeNav) {
      // Rotas do Fornecedor
      case 'supplier-dashboard':
        return <SupplierDashboard />;
      case 'supplier-prereg':
        return <SupplierPreRegistration />;
      case 'supplier-wizard':
        return <SupplierWizard />;
      case 'supplier-documents':
        return <SupplierDocuments />;
      case 'supplier-pending':
        return <SupplierPending />;
      case 'supplier-history':
        return <SupplierHistory />;

      // Rotas de Compras
      case 'procurement-dashboard':
        return <ProcurementDashboard />;
      case 'vendor-list':
        return <VendorList />;
      case 'procurement-awards':
        return <ProcurementAwards />;
      case 'procurement-coverage':
        return <ProcurementCoverage />;

      // Rotas do Time de Cadastro / ERP
      case 'erp-dashboard':
        return <ErpDashboard />;
      case 'erp-queue':
        return <ErpQueue />;
      case 'erp-kanban':
        return <ErpKanban />;
      case 'erp-history':
        return <ErpHistory />;

      default:
        if (currentUser?.role === 'fornecedor') return <SupplierDashboard />;
        if (currentUser?.role === 'compras') return <ProcurementDashboard />;
        return <ErpDashboard />;
    }
  };

  return (
    <>
      {/* Layout principal isolado: sidebar + área do módulo */}
      <div className="app-layout">
        <Sidebar collapsed={sidebarCollapsed} />

        <div className="main-container">
          <Header toggleSidebar={() => setSidebarCollapsed((c) => !c)} />
          <main className="content-area">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Modais e drawers contextuais */}
      <SupplierDrawer />
      <AwardSupplierModal />
      <ErpRequestDrawer />
      <ToastContainer />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
