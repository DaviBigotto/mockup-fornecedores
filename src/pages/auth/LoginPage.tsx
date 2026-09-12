// ==============================================================================
// HUB CENTRAL DE ACESSOS E AUTENTICAÇÃO - PLURIX ORGANIZER
// Permite login e cadastro de usuários reais nos 3 painéis de operação
// ==============================================================================

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  ShoppingBag,
  Database,
  UserPlus,
  Building,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onNavigateToPreReg: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToPreReg }) => {
  const { login, registerUser, showToast } = useApp();

  // Painel Selecionado
  const [selectedRole, setSelectedRole] = useState<UserRole>('fornecedor');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  const panelConfigs = {
    fornecedor: {
      role: 'fornecedor' as UserRole,
      title: 'Portal do Fornecedor',
      subtitle: 'Credenciamento, cadastro guiado de 8 etapas e gestão de certidões',
      color: '#002AE6',
      lightBg: '#EEF2FF',
      icon: UserCheck,
      defaultCompanyPlaceholder: 'Ex: Minha Empresa de Tecnologia Ltda.',
      ctaText: 'Entrar no Portal do Fornecedor',
      registerCtaText: 'Cadastrar Usuário do Fornecedor',
    },
    compras: {
      role: 'compras' as UserRole,
      title: 'Área de Compras & Sourcing',
      subtitle: 'Vendor List, análise técnica de risco e matriz de decisão pós-premiação',
      color: '#D97706',
      lightBg: '#FEF3C7',
      icon: ShoppingBag,
      defaultCompanyPlaceholder: 'Ex: Plurix Compras Corporativas',
      ctaText: 'Acessar Módulo de Compras',
      registerCtaText: 'Cadastrar Usuário de Compras',
    },
    cadastro: {
      role: 'cadastro' as UserRole,
      title: 'Time de Cadastro & ERP',
      subtitle: 'Fila operacional de requisições, saneamento fiscal e integração ERP',
      color: '#059669',
      lightBg: '#D1FAE5',
      icon: Database,
      defaultCompanyPlaceholder: 'Ex: Plurix Governança & Cadastro ERP',
      ctaText: 'Acessar Central de Cadastro & ERP',
      registerCtaText: 'Cadastrar Usuário de Cadastro ERP',
    },
  };

  const currentConfig = panelConfigs[selectedRole];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast('Por favor, informe seu e-mail corporativo.', 'error');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'login') {
        await login(email.trim(), password || '123456', selectedRole);
      } else {
        if (!name.trim()) {
          showToast('Informe seu nome completo.', 'error');
          setLoading(false);
          return;
        }

        await registerUser({
          name: name.trim(),
          email: email.trim(),
          password: password || '123456',
          role: selectedRole,
          companyName: companyName.trim() || undefined,
        });
      }
    } catch (err: any) {
      // toast já tratado
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0F172A',
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          height: 68,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 16,
              padding: '6px 14px',
              borderRadius: 6,
              letterSpacing: '0.06em',
            }}
          >
            PLURIX
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>
            Organizer
          </span>
          <span style={{ color: '#CBD5E1', fontSize: 14 }}>|</span>
          <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
            Módulo de Gestão, Homologação e Cadastro de Fornecedores
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 20,
              backgroundColor: '#EEF2FF',
              color: 'var(--color-primary)',
              fontWeight: 600,
            }}
          >
            Ambiente de Homologação Executiva
          </span>
        </div>
      </header>

      {/* Conteúdo Principal com Layout Split */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #EDF2F7 100%)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1100,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
            gap: 48,
            alignItems: 'center',
          }}
        >
          {/* Coluna Esquerda: Apresentação Institucional e Fluxo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 16,
                  backgroundColor: '#E2E8F0',
                  color: '#334155',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                <ShieldCheck size={14} color="var(--color-primary)" />
                Portal de Acesso Integrado
              </div>

              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1.25,
                  color: '#0F172A',
                  marginBottom: 14,
                  letterSpacing: '-0.02em',
                }}
              >
                Gestão, Homologação & Cadastro no ERP Plurix
              </h1>

              <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, maxWidth: 480 }}>
                Acesse ou cadastre seu usuário no painel correspondente para testar o fluxo ponta a ponta:
                do onboarding do fornecedor à homologação em compras e integração no ERP.
              </p>
            </div>

            {/* As 3 Etapas do Fluxo Operacional */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Etapa 1 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 18px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    backgroundColor: '#EEF2FF',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  1
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 2 }}>
                    Portal do Fornecedor (Onboarding)
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>
                    Cadastro guiado (8 etapas), dados societários, bancários e submissão de certidões e alvarás.
                  </div>
                </div>
              </div>

              {/* Etapa 2 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 18px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  2
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 2 }}>
                    Área de Compras & Sourcing
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>
                    Análise da Vendor List, classificação de riscos, homologação e premiação em Sourcing.
                  </div>
                </div>
              </div>

              {/* Etapa 3 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 18px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    backgroundColor: '#D1FAE5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  3
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 2 }}>
                    Time de Cadastro & ERP
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>
                    Fila de requisições, saneamento fiscal (Reforma Tributária), emissão do código ERP e conclusão.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Card Gateway de Acesso */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '32px 28px',
              boxShadow: '0 12px 32px -8px rgba(0, 26, 143, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            }}
          >
            {/* Título do Card */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                Selecione o Painel de Acesso
              </h2>
              <p style={{ fontSize: 13, color: '#64748B' }}>
                Escolha a área que deseja acessar ou se cadastrar
              </p>
            </div>

            {/* Seletor Segmentado dos 3 Perfis */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                backgroundColor: '#F1F5F9',
                padding: 4,
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              {/* Opção 1: Fornecedor */}
              <button
                type="button"
                onClick={() => setSelectedRole('fornecedor')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 6px',
                  borderRadius: 9,
                  border: 'none',
                  backgroundColor: selectedRole === 'fornecedor' ? '#FFFFFF' : 'transparent',
                  color: selectedRole === 'fornecedor' ? 'var(--color-primary)' : '#64748B',
                  fontWeight: selectedRole === 'fornecedor' ? 700 : 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: selectedRole === 'fornecedor' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <UserCheck size={18} />
                <span>Fornecedor</span>
              </button>

              {/* Opção 2: Compras */}
              <button
                type="button"
                onClick={() => setSelectedRole('compras')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 6px',
                  borderRadius: 9,
                  border: 'none',
                  backgroundColor: selectedRole === 'compras' ? '#FFFFFF' : 'transparent',
                  color: selectedRole === 'compras' ? '#D97706' : '#64748B',
                  fontWeight: selectedRole === 'compras' ? 700 : 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: selectedRole === 'compras' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <ShoppingBag size={18} />
                <span>Compras</span>
              </button>

              {/* Opção 3: Cadastro */}
              <button
                type="button"
                onClick={() => setSelectedRole('cadastro')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 6px',
                  borderRadius: 9,
                  border: 'none',
                  backgroundColor: selectedRole === 'cadastro' ? '#FFFFFF' : 'transparent',
                  color: selectedRole === 'cadastro' ? '#059669' : '#64748B',
                  fontWeight: selectedRole === 'cadastro' ? 700 : 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: selectedRole === 'cadastro' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Database size={18} />
                <span>Cadastro ERP</span>
              </button>
            </div>

            {/* Cabeçalho do Painel Ativo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                backgroundColor: currentConfig.lightBg,
                borderRadius: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: '#FFFFFF',
                  color: currentConfig.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <currentConfig.icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                  {currentConfig.title}
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  {currentConfig.subtitle}
                </div>
              </div>
            </div>

            {/* Alternador de Abas: Login vs Cadastro de Usuário */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #E2E8F0',
                marginBottom: 20,
              }}
            >
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderBottom: authMode === 'login' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  fontWeight: authMode === 'login' ? 700 : 500,
                  color: authMode === 'login' ? 'var(--color-primary)' : '#64748B',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Entrar com Minha Conta
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderBottom: authMode === 'register' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  fontWeight: authMode === 'register' ? 700 : 500,
                  color: authMode === 'register' ? 'var(--color-primary)' : '#64748B',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Criar Nova Conta
              </button>
            </div>

            {/* Formulário Unificado */}
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Campo Nome (Apenas em Cadastro) */}
              {authMode === 'register' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Nome Completo *</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ fontSize: 13, padding: '9px 12px' }}
                  />
                </div>
              )}

              {/* Campo Empresa / Unidade (Apenas em Cadastro) */}
              {authMode === 'register' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Empresa ou Departamento</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder={currentConfig.defaultCompanyPlaceholder}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{ fontSize: 13, padding: '9px 12px' }}
                  />
                </div>
              )}

              {/* Campo E-mail */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>E-mail Corporativo *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input-control"
                    placeholder="seu.email@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ fontSize: 13, padding: '9px 12px 9px 36px' }}
                  />
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Senha de Acesso</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="input-control"
                    placeholder={authMode === 'register' ? 'Crie sua senha' : 'Sua senha'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ fontSize: 13, padding: '9px 12px 9px 36px' }}
                  />
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
              </div>

              {/* Botão de Submissão */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 18px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 6,
                  boxShadow: '0 4px 12px rgba(0, 26, 143, 0.2)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>
                  {loading
                    ? 'Processando...'
                    : authMode === 'login'
                    ? currentConfig.ctaText
                    : currentConfig.registerCtaText}
                </span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Ação Especial: Pré-cadastro de Nova Empresa (se Fornecedor) */}
            {selectedRole === 'fornecedor' && (
              <div style={{ marginTop: 18, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', color: '#CBD5E1' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                  <span style={{ padding: '0 12px', fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                    Primeiro Acesso de Fornecedor?
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                </div>

                <button
                  type="button"
                  onClick={onNavigateToPreReg}
                  style={{
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: 'var(--color-primary)',
                    borderRadius: 10,
                    padding: '11px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                >
                  <Building size={16} />
                  <span>Cadastrar Minha Empresa (Novo Pré-Cadastro)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
