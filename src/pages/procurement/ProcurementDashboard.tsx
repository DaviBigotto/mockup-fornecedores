// ==============================================================================
// DASHBOARD DA VENDOR LIST (ÁREA DE COMPRAS) - PLURIX ORGANIZER
// Visão estratégica da base de fornecedores para tomada de decisão
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProcurementMetrics } from '../../types';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Database,
  Building,
  TrendingUp,
  PieChart,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const ProcurementDashboard: React.FC = () => {
  const { setActiveNav, openAwardModal, dataVersion } = useApp();
  const [metrics, setMetrics] = useState<ProcurementMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/metrics/procurement')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dataVersion]);

  if (loading || !metrics) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Carregando dashboard da Vendor List...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Cabeçalho de Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Dashboard Estratégico da Vendor List
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Visão consolidada de qualificação, conformidade e integração ERP dos fornecedores do Grupo Plurix.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveNav('vendor-list')}
          >
            <Users size={16} /> Ver Base Completa
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openAwardModal()}
          >
            <PlusCircle size={16} /> Registrar Fornecedor Premiado
          </button>
        </div>
      </div>

      {/* Alerta de Categorias com Baixa Cobertura */}
      {metrics.lowCoverageCategories.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-border)',
            borderRadius: 10,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={20} color="var(--status-warning)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--status-warning-text)' }}>
              <strong>Atenção para Cobertura de Fornecedores:</strong> As categorias{' '}
              <strong>{metrics.lowCoverageCategories.join(', ')}</strong> possuem baixa densidade de parceiros
              homologados. Recomenda-se prospecção de novos fornecedores.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveNav('procurement-coverage')}
            style={{ whiteSpace: 'nowrap' }}
          >
            Ver Detalhes de Cobertura
          </button>
        </div>
      )}

      {/* Grid de Métricas Principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Total na Base */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Base de Fornecedores</span>
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-primary)' }}>
            {metrics.totalSuppliers}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            +{metrics.newSuppliersMonth} novos credenciados neste mês
          </div>
        </div>

        {/* Homologados */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Homologados Plenamente</span>
            <ShieldCheck size={18} color="var(--status-success)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--status-success)' }}>
            {metrics.homologatedCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--status-success-text)' }}>
            Aptos para fornecimento e contratação
          </div>
        </div>

        {/* Ativos no ERP */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Ativos no ERP</span>
            <Database size={18} color="var(--color-accent)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
            {metrics.activeInErpCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Cadastrados no Protheus / SAP
          </div>
        </div>

        {/* Disponíveis mas sem ERP */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Disponíveis sem ERP</span>
            <Building size={18} color="var(--status-neutral)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-secondary)' }}>
            {metrics.notInErpCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Criados sob demanda de premiação
          </div>
        </div>
      </div>

      {/* Indicadores de Conformidade Documental e Cadastral */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Cadastros Completos</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{metrics.completeCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Formulário e 8 etapas preenchidas
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Com Pendências / Ajustes</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-warning)' }}>{metrics.pendingCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Aguardando retificação do fornecedor
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Certidões Vencendo (30d)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-warning)' }}>{metrics.expiringDocsCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Requerem renovação preventiva
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--status-danger)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Documentos Vencidos</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-danger)' }}>{metrics.expiredDocsCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Bloqueio administrativo para novos pedidos
          </div>
        </div>
      </div>

      {/* Gráficos / Cobertura por Categoria e Unidade */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Cobertura por Categoria */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Cobertura por Categoria de Suprimentos
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Homologados / Total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {metrics.coverageByCategory.map((item) => {
              const pct = item.count > 0 ? Math.round((item.homologated / item.count) * 100) : 0;
              return (
                <div key={item.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.category}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <strong>{item.homologated}</strong> homologados ({item.count} cadastrados)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      backgroundColor: '#E2E8F0',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, item.count * 20)}%`,
                        height: '100%',
                        backgroundColor: item.homologated > 0 ? 'var(--color-primary)' : 'var(--status-warning)',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cobertura por Região e Unidade */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Distribuição por Regiões e CDs
            </h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setActiveNav('procurement-coverage')}
            >
              Ver mapa completo
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {metrics.coverageByUnit.slice(0, 5).map((u) => (
              <div
                key={u.unit}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building size={16} color="var(--color-primary)" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{u.unit}</span>
                </div>
                <span
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {u.count} fornecedores
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
