// ==============================================================================
// PRÉ-CADASTRO DO FORNECEDOR - PLURIX ORGANIZER
// Tela inicial para onboarding ágil de novos parceiros comerciais
// ==============================================================================

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCnpj, formatPhone } from '../../utils/formatters';
import { ShieldCheck, ArrowRight, Building, CheckCircle2, Lock } from 'lucide-react';

export const SupplierPreRegistration: React.FC = () => {
  const { setActiveNav, showToast, triggerRefresh, setActiveSupplierId, currentUser, login } = useApp();

  const [cnpj, setCnpj] = useState('');
  const [corporateName, setCorporateName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cnpj || !corporateName || !contactName || !email) {
      showToast('Preencha os campos obrigatórios para continuar.', 'error');
      return;
    }

    if (!acceptedTerms) {
      showToast('É necessário aceitar os termos de uso e política de privacidade.', 'error');
      return;
    }

    setLoading(true);

    try {
      const userEmail = (currentUser?.email || email).toLowerCase().trim();
      const payload = {
        cnpj,
        corporateName,
        tradeName: tradeName || corporateName,
        createdBy: userEmail,
        contacts: [
          {
            id: `c-${Date.now()}`,
            name: contactName,
            role: 'Representante Legal',
            email: userEmail,
            phone,
            isPrimary: true,
          },
        ],
      };

      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar pré-cadastro');
      }

      const created = await res.json();
      if (created?.id) {
        setActiveSupplierId(created.id);
      }

      if (!currentUser) {
        await login(email, password, 'fornecedor');
      }

      showToast('Pré-cadastro realizado com sucesso! Direcionando para o formulário guiado.', 'success');
      triggerRefresh();
      setActiveNav('supplier-wizard');
    } catch (err: any) {
      showToast(err.message || 'Erro ao realizar pré-cadastro', 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ maxWidth: 760, margin: '20px auto' }}>
      <div className="card" style={{ padding: '36px 40px', boxShadow: 'var(--shadow-md)' }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              marginBottom: 16,
            }}
          >
            <Building size={28} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Credenciamento de Fornecedor - Plurix
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Inicie seu pré-cadastro na plataforma Organizer para participar de processos de cotação e homologação.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Dados da Empresa */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              1. Identificação Empresarial
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  CNPJ <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ex: Tech Soluções"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Razão Social <span className="required">*</span>
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ex: Tech Soluções de Informática Ltda."
                value={corporateName}
                onChange={(e) => setCorporateName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contato do Responsável */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              2. Responsável pelo Cadastro
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  Nome Completo <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Seu nome"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Telefone Comercial / WhatsApp
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  E-mail Corporativo <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className="input-control"
                  placeholder="responsavel@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Criar Senha de Acesso
                </label>
                <input
                  type="password"
                  className="input-control"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Termos de Aceite */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ marginTop: 2 }}
                required
              />
              <span>
                Declaro que as informações prestadas são verdadeiras e concordo com os{' '}
                <a href="#termos" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a href="#privacidade" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  Política de Privacidade de Fornecedores Plurix
                </a>.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', maxWidth: 280 }}
            >
              {loading ? 'Processando...' : 'Concluir Pré-Cadastro'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
