// ==============================================================================
// GESTÃO DE FORNECEDORES PREMIADOS & FLUXO PÓS-PREMIAÇÃO - ÁREA DE COMPRAS
// Acompanhamento interativo da Matriz de Decisão Plurix (Caminhos A, B, C, D)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SourcingAward, FlowStepStatus } from '../../types';
import { FlowStepBadge } from '../../components/common/StatusBadges';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import {
  Award,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileCheck,
  Building,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
  Eye,
  Info,
} from 'lucide-react';

export const ProcurementAwards: React.FC = () => {
  const { openAwardModal, showToast, triggerRefresh, dataVersion, setActiveNav } = useApp();
  const [awards, setAwards] = useState<SourcingAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAwardId, setExpandedAwardId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/awards')
      .then((r) => r.json())
      .then((data: SourcingAward[]) => {
        setAwards(data);
        if (data.length > 0 && !expandedAwardId) {
          setExpandedAwardId(data[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dataVersion]);

  const toggleExpand = (id: string) => {
    setExpandedAwardId((prev) => (prev === id ? null : id));
  };

  const handleUpdateStep = async (awardId: string, stepIndex: number, newStatus: FlowStepStatus) => {
    try {
      const res = await fetch(`/api/awards/${awardId}/steps/${stepIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Falha ao atualizar etapa');

      showToast(`Etapa ${stepIndex} concluída com sucesso pela Área de Compras!`, 'success');
      triggerRefresh();
    } catch {
      showToast('Erro ao atualizar etapa do fluxo.', 'error');
    }
  };

  const getAreaBadge = (area?: string) => {
    switch (area) {
      case 'Compras':
        return <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Área: Compras</span>;
      case 'Governança & ERP':
        return <span style={{ backgroundColor: '#F3E8FF', color: '#6B21A8', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Área: Governança & ERP</span>;
      case 'Aprovadores':
        return <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Área: Alçada / Diretoria</span>;
      case 'Integração':
        return <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Área: Integração Sistêmica</span>;
      case 'Jurídico':
        return <span style={{ backgroundColor: '#F1F5F9', color: '#334155', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Área: Jurídico / Contratos</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Carregando processos de premiação...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Fornecedores Premiados & Matriz de Decisão
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Acompanhamento das etapas operacionais pós-sourcing (Caminhos A, B, C e D) até a liberação da Ordem de Compra.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => openAwardModal()}
        >
          <PlusCircle size={16} /> Nova Premiação de Fornecedor
        </button>
      </div>

      {/* Lista de Processos Premiados */}
      {awards.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhum processo de premiação registrado até o momento.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {awards.map((award) => {
            const isExpanded = expandedAwardId === award.id;
            const flow = award.decisionFlow;
            const completedCount = flow?.steps.filter((s) => s.status === 'Concluída').length || 0;
            const totalSteps = flow?.steps.filter((s) => s.status !== 'Não aplicável').length || 1;
            const progressPct = Math.round((completedCount / totalSteps) * 100);

            return (
              <div key={award.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header do Card */}
                <div
                  style={{
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isExpanded ? '#F8FAFC' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)',
                    borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                  }}
                  onClick={() => toggleExpand(award.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Award size={24} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {award.sourcingProcessCode}
                        </span>
                        <span style={{ color: 'var(--border-medium)' }}>•</span>
                        <span style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>
                          {award.supplierName}
                        </span>
                        <span
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: '#FFFFFF',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}
                        >
                          Caminho {flow?.pathCode}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {award.businessUnit} • Categoria: {award.category} • Comprador: {award.buyerName} • Valor:{' '}
                        <strong>{formatCurrency(award.contractValue)}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {/* Progresso */}
                    <div style={{ textAlign: 'right', minWidth: 140 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                        Progresso: <strong>{progressPct}%</strong> ({completedCount}/{totalSteps})
                      </div>
                      <div
                        style={{
                          width: 140,
                          height: 6,
                          backgroundColor: '#E2E8F0',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            backgroundColor: progressPct === 100 ? 'var(--status-success)' : 'var(--color-accent)',
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>

                    <span className={`badge ${award.status === 'Concluído' ? 'badge-success' : 'badge-info'}`}>
                      {award.status}
                    </span>

                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Conteúdo Expansível com Detalhes das Etapas */}
                {isExpanded && flow && (
                  <div style={{ padding: '24px' }}>
                    <div
                      style={{
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: 8,
                        padding: '12px 16px',
                        marginBottom: 16,
                        fontSize: 13,
                        color: '#1E3A8A',
                      }}
                    >
                      <div style={{ marginBottom: 4 }}>
                        <strong>Regra de Negócio ({flow.pathName}):</strong> {flow.rationale}
                      </div>
                      <div style={{ fontSize: 11, color: '#3B82F6', fontStyle: 'italic' }}>
                        * Regra demonstrativa de alçadas, prazos e caminhos sujeita à validação formal do negócio.
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', margin: 0 }}>
                        Etapas Operacionais e Responsáveis
                      </h4>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Cada área é responsável exclusivamente por suas etapas deliberativas
                      </span>
                    </div>

                    {/* Timeline de Etapas com Responsabilidades */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {flow.steps.map((step) => {
                        const isApplicable = step.status !== 'Não aplicável';
                        const isDone = step.status === 'Concluída';
                        const isComprasStep = step.responsibleArea === 'Compras' || step.actionType === 'concluir';
                        const isCadastroStep = step.responsibleArea === 'Governança & ERP';

                        return (
                          <div
                            key={step.stepIndex}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 18px',
                              borderRadius: 8,
                              backgroundColor: isDone ? '#ECFDF5' : '#FFFFFF',
                              border: `1px solid ${isDone ? '#A7F3D0' : 'var(--border-subtle)'}`,
                              opacity: isApplicable ? 1 : 0.6,
                              gap: 16,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                              <div
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: '50%',
                                  backgroundColor: isDone
                                    ? 'var(--status-success)'
                                    : isApplicable
                                    ? 'var(--color-primary-light)'
                                    : '#E2E8F0',
                                  color: isDone ? '#FFFFFF' : isApplicable ? 'var(--color-primary)' : 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: 12,
                                  flexShrink: 0,
                                }}
                              >
                                {isDone ? <CheckCircle2 size={16} /> : step.stepIndex}
                              </div>

                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                                    {step.stepName}
                                  </span>
                                  {getAreaBadge(step.responsibleArea)}
                                  {step.responsiblePerson && (
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                      • Responsável: <strong>{step.responsiblePerson}</strong>
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                  {step.description} {step.completedAt && `• Concluído em ${formatDateTime(step.completedAt)}`}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                              <FlowStepBadge status={step.status} />

                              {/* Ações Inteligentes por Responsabilidade */}
                              {isApplicable && !isDone && (
                                <>
                                  {isComprasStep ? (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleUpdateStep(award.id, step.stepIndex, 'Concluída')}
                                      title="Concluir liberação da ordem de compra formal"
                                    >
                                      <CheckCircle2 size={13} /> Concluir Etapa
                                    </button>
                                  ) : isCadastroStep ? (
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => setActiveNav('erp-queue')}
                                      title="Visualizar andamento na Fila de Governança ERP"
                                    >
                                      <Clock size={13} /> Acompanhar ERP
                                    </button>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: 'var(--text-muted)',
                                        backgroundColor: '#F8FAFC',
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        border: '1px solid var(--border-subtle)',
                                      }}
                                    >
                                      Aguardando {step.responsibleArea || 'Área'}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Alerta de Pedido de Compra */}
                    {flow.isReadyForPurchaseOrder && (
                      <div
                        style={{
                          marginTop: 20,
                          backgroundColor: 'var(--status-success-bg)',
                          border: '1px solid var(--status-success-border)',
                          borderRadius: 8,
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <ShieldCheck size={24} color="var(--status-success)" />
                        <div style={{ fontSize: 13, color: 'var(--status-success-text)' }}>
                          <strong>Processo Apto para Emissão do Pedido:</strong> Todas as validações cadastrais, jurídicas e de integração ERP foram concluídas com êxito. A Ordem de Compra já pode ser gerada no Organizer.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
