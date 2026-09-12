// ==============================================================================
// PAINEL INICIAL DO FORNECEDOR - PLURIX ORGANIZER
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import { RegistrationStatusBadge, DocumentStatusBadge } from '../../components/common/StatusBadges';
import { formatDate, formatDateTime } from '../../utils/formatters';
import {
  ArrowRight,
  AlertTriangle,
  FileCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  UploadCloud,
  FileText,
} from 'lucide-react';

export const SupplierDashboard: React.FC = () => {
  const { setActiveNav, dataVersion, activeSupplierId } = useApp();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega o fornecedor ativo no portal
    if (activeSupplierId) {
      fetch(`/api/suppliers/${activeSupplierId}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setSupplier(data);
          setLoading(false);
        })
        .catch(() => {
          setSupplier(null);
          setLoading(false);
        });
    } else {
      fetch('/api/suppliers')
        .then((res) => res.json())
        .then((data: any[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setSupplier(data[0]);
          } else {
            setSupplier(null);
          }
          setLoading(false);
        })
        .catch(() => {
          setSupplier(null);
          setLoading(false);
        });
    }
  }, [activeSupplierId, dataVersion]);


  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Carregando informações do portal do fornecedor...
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="card" style={{ padding: '48px 32px', textAlign: 'center', maxWidth: 640, margin: '40px auto' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Building size={32} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          Bem-vindo ao Portal de Fornecedores Plurix
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Você ainda não possui uma empresa cadastrada ou em processo de homologação ativa.
          Inicie o seu pré-cadastro para preencher o formulário guiado e enviar os documentos necessários.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setActiveNav('supplier-prereg')}
          style={{ padding: '12px 24px', fontSize: 14, fontWeight: 700 }}
        >
          Iniciar Pré-Cadastro Agora <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  const expiringDocs = supplier.documents?.filter((d) => d.status === 'Vencendo') || [];
  const pendingDocs = supplier.documents?.filter((d) => d.status === 'Pendente' || d.status === 'Rejeitado') || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner de Boas-Vindas e Status Geral */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #001A8F 0%, #00105A 100%)',
          color: '#FFFFFF',
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              CNPJ: {supplier.cnpj}
            </span>
            <span style={{ color: 'var(--color-accent)', fontSize: 13 }}>
              Última atualização: {formatDateTime(supplier.updatedAt)}
            </span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#FFFFFF' }}>
            Olá, {supplier.tradeName}!
          </h1>
          <p style={{ color: '#E2E8F0', fontSize: 14, lineHeight: 1.5 }}>
            Acompanhe o andamento do seu credenciamento e homologação na plataforma Organizer do Grupo Plurix.
            Mantenha suas certidões e dados bancários sempre em conformidade.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: '18px 24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'right',
            minWidth: 240,
          }}
        >
          <div style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 6 }}>
            Situação do Cadastro
          </div>
          <div style={{ marginBottom: 12 }}>
            <RegistrationStatusBadge status={supplier.status} />
          </div>
          <button
            type="button"
            className="btn btn-accent"
            style={{ width: '100%' }}
            onClick={() => setActiveNav('supplier-wizard')}
          >
            {supplier.completionPercentage < 100 ? 'Continuar Cadastro' : 'Revisar / Atualizar Dados'}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Barra de Progresso do Cadastro Guiado */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              Completude do Cadastro no Portal
            </span>
            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              (Etapa {supplier.currentStep} de 8 concluída)
            </span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-primary)' }}>
            {supplier.completionPercentage}%
          </span>
        </div>

        <div
          style={{
            width: '100%',
            height: 10,
            backgroundColor: '#E2E8F0',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${supplier.completionPercentage}%`,
              height: '100%',
              backgroundColor: supplier.completionPercentage === 100 ? 'var(--status-success)' : 'var(--color-accent)',
              borderRadius: 999,
              transition: 'width 400ms ease',
            }}
          />
        </div>
      </div>

      {/* Alertas e Pendências Que Exigem Ação */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Card 1: Pendências Documentais */}
        <div className="card" style={{ borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <AlertTriangle size={20} color="var(--status-warning)" />
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Atenção Documental</h3>
          </div>

          {expiringDocs.length === 0 && pendingDocs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--status-success)' }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                Nenhuma pendência ou certidão vencida no momento!
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingDocs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: 'var(--status-danger-bg)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: 'var(--status-danger-text)',
                  }}
                >
                  <strong>{doc.documentName}:</strong> Pendente de reenvio com data vigente.
                </div>
              ))}
              {expiringDocs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: 'var(--status-warning-bg)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: 'var(--status-warning-text)',
                  }}
                >
                  <strong>{doc.documentName}:</strong> Vence em {formatDate(doc.expirationDate)}.
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 6, alignSelf: 'flex-start' }}
                onClick={() => setActiveNav('supplier-documents')}
              >
                Gerenciar Documentos
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Status do Cadastro x ERP (Informativo de acompanhamento) */}
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Building size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Acompanhamento no Organizer</h3>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
            Sua empresa está presente na base ativa de fornecedores consultada pelo time de Compras da Plurix.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Homologação</div>
              <RegistrationStatusBadge status={supplier.status} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Documentação</div>
              <DocumentStatusBadge status={supplier.documentStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <button
          type="button"
          className="card card-hoverable"
          style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-subtle)' }}
          onClick={() => setActiveNav('supplier-wizard')}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Dados Cadastrais</h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Editar sócios, atuação e dados bancários</p>
          </div>
        </button>

        <button
          type="button"
          className="card card-hoverable"
          style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-subtle)' }}
          onClick={() => setActiveNav('supplier-documents')}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              backgroundColor: '#ECFDF5',
              color: 'var(--status-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UploadCloud size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Dossiê de Certidões</h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enviar ou substituir CNDs e alvarás</p>
          </div>
        </button>

        <button
          type="button"
          className="card card-hoverable"
          style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-subtle)' }}
          onClick={() => setActiveNav('supplier-history')}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              backgroundColor: '#EFF6FF',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Linha do Tempo</h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Histórico completo de interações</p>
          </div>
        </button>
      </div>
    </div>
  );
};
