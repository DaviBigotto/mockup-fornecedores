// ==============================================================================
// DASHBOARD OPERACIONAL DO TIME DE CADASTRO / ERP - PLURIX ORGANIZER
// Monitoramento de volumetria, SLA e throughput de criação de parceiros no ERP
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ErpQueueMetrics, ErpRequest } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  KanbanSquare,
  ArrowRight,
  Zap,
  UserX,
  Filter,
  Eye,
  ShieldAlert,
} from 'lucide-react';

export const ErpDashboard: React.FC = () => {
  const { setActiveNav, setErpQueueStatusFilter, openErpDrawer, dataVersion } = useApp();
  const [metrics, setMetrics] = useState<ErpQueueMetrics | null>(null);
  const [requests, setRequests] = useState<ErpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/metrics/erp').then((r) => r.json()),
      fetch('/api/erp-requests').then((r) => r.json()),
    ])
      .then(([metricsData, requestsData]) => {
        setMetrics(metricsData);
        setRequests(requestsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dataVersion]);

  const handleCardClick = (statusFilter: string) => {
    setErpQueueStatusFilter(statusFilter);
    setActiveNav('erp-queue');
  };

  if (loading || !metrics) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Carregando métricas da fila ERP...</div>;
  }

  const slaPercentage =
    metrics.totalRequests > 0 ? Math.round((metrics.onTimeCount / metrics.totalRequests) * 100) : 100;

  // Itens que demandam atenção
  const nowStr = new Date().toISOString().split('T')[0];
  const attentionItems = requests.filter((r) => {
    if (r.currentStatus === 'Concluído' || r.currentStatus === 'Cancelado') return false;
    const isDelayed = r.deadline < nowStr;
    const isUnassigned = !r.assignedAnalyst || r.assignedAnalyst === 'Não atribuído';
    const isPendingAdjustment = r.currentStatus === 'Aguardando ajuste' || r.currentStatus === 'Aguardando informação';
    const isIntegrationFailed = r.currentStatus === 'Falha na integração';
    return isDelayed || isUnassigned || isPendingAdjustment || isIntegrationFailed;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Dashboard Operacional de Governança & ERP
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Governança de dados mestres, triagem documental e integração Protheus / SAP das investidas do Grupo Plurix.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setErpQueueStatusFilter('Todos');
              setActiveNav('erp-queue');
            }}
          >
            <Building2 size={16} /> Fila de Solicitações (Tabela)
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveNav('erp-kanban')}
          >
            <KanbanSquare size={16} /> Quadro Kanban
          </button>
        </div>
      </div>

      {/* Grid de Cards de Volumetria da Fila (Filtros Clicáveis) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Visão Geral da Fila Operacional (Clique no card para filtrar a tabela)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
          {/* Total */}
          <div
            className="card card-hoverable"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
            onClick={() => handleCardClick('Todos')}
            title="Filtrar todas as solicitações"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Total na Fila</span>
              <Building2 size={18} color="var(--color-primary)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-primary)' }}>
              {metrics.totalRequests}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={11} /> Ver todas na fila
            </div>
          </div>

          {/* Novas / Recebidas */}
          <div
            className="card card-hoverable"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid #64748B', cursor: 'pointer' }}
            onClick={() => handleCardClick('Recebido')}
            title="Filtrar solicitações novas recebidas"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Novas / Recebidas</span>
              <Clock size={18} color="#64748B" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#334155' }}>
              {metrics.pendingCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={11} /> Aguardando triagem
            </div>
          </div>

          {/* Em Execução */}
          <div
            className="card card-hoverable"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--color-accent)', cursor: 'pointer' }}
            onClick={() => handleCardClick('Em triagem')}
            title="Filtrar solicitações em triagem ou input"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Em Execução</span>
              <Zap size={18} color="var(--color-accent)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-primary)' }}>
              {metrics.inProgressCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={11} /> Em triagem ou integração
            </div>
          </div>

          {/* Aguardando Ajustes */}
          <div
            className="card card-hoverable"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--status-warning)', cursor: 'pointer' }}
            onClick={() => handleCardClick('Aguardando ajuste')}
            title="Filtrar solicitações com pendência"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Aguardando Ajuste</span>
              <AlertTriangle size={18} color="var(--status-warning)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--status-warning)' }}>
              {metrics.waitingAdjustmentCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={11} /> Pendências apontadas
            </div>
          </div>

          {/* Concluídos */}
          <div
            className="card card-hoverable"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--status-success)', cursor: 'pointer' }}
            onClick={() => handleCardClick('Concluído')}
            title="Filtrar cadastros concluídos no ERP"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Concluídos no ERP</span>
              <CheckCircle2 size={18} color="var(--status-success)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--status-success)' }}>
              {metrics.completedCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--status-success-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={11} /> Código ERP ativo
            </div>
          </div>
        </div>
      </div>

      {/* Seção Compacta: Atenção Necessária */}
      {attentionItems.length > 0 && (
        <div className="card" style={{ padding: '18px 20px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#D97706" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#92400E', margin: 0 }}>
                Atenção Necessária ({attentionItems.length} {attentionItems.length === 1 ? 'item' : 'itens'})
              </h3>
            </div>
            <span style={{ fontSize: 11, color: '#B45309' }}>
              Prioridades operacionais que requerem ação do time
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attentionItems.slice(0, 3).map((item) => {
              const isDelayed = item.deadline < nowStr;
              const isUnassigned = !item.assignedAnalyst || item.assignedAnalyst === 'Não atribuído';

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 6,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #FCD34D',
                    cursor: 'pointer',
                  }}
                  onClick={() => openErpDrawer(item.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--color-primary)' }}>
                      {item.requestCode}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {item.supplierName}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      ({item.requestingUnit})
                    </span>
                    {isDelayed && (
                      <span className="badge badge-danger" style={{ fontSize: 10 }}>Prazo Expirado</span>
                    )}
                    {isUnassigned && (
                      <span className="badge badge-warning" style={{ fontSize: 10 }}>Sem Analista</span>
                    )}
                    {item.currentStatus === 'Falha na integração' && (
                      <span className="badge badge-danger" style={{ fontSize: 10 }}>Falha de Integração</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SLA: {formatDate(item.deadline)}</span>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11 }}>
                      <Eye size={12} /> Atender
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monitor de SLA de Atendimento */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Indicador de Eficiência e Cumprimento de SLA
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Meta operacional demonstrativa: 5 dias úteis para Caminho A e 7 dias para Caminho B.
            </p>
          </div>

          <span
            style={{
              backgroundColor: metrics.delayedCount === 0 ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
              color: metrics.delayedCount === 0 ? 'var(--status-success-text)' : 'var(--status-warning-text)',
              fontSize: 13,
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 999,
            }}
          >
            {slaPercentage}% dentro do prazo
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 10,
              padding: 16,
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'var(--status-success-bg)',
                color: 'var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--status-success)' }}>
                {metrics.onTimeCount} solicitações
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dentro do SLA previsto</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 10,
              padding: 16,
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: metrics.delayedCount > 0 ? 'var(--status-danger-bg)' : '#F1F5F9',
                color: metrics.delayedCount > 0 ? 'var(--status-danger)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: metrics.delayedCount > 0 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                {metrics.delayedCount} solicitações
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Demandas com prazo extrapolado</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          * SLA demonstrativo, sujeito à validação formal dos acordos de nível de serviço com as áreas de negócio.
        </div>
      </div>
    </div>
  );
};

