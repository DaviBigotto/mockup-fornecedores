// ==============================================================================
// QUADRO KANBAN OPERACIONAL - GOVERNANÇA E TIME DE CADASTRO ERP
// 7 Colunas operacionais com esteira de integração, drag & drop e ações rápidas
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ErpRequest } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building,
  Table,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Send,
} from 'lucide-react';

interface KanbanColDef {
  id: ErpRequest['currentStatus'];
  title: string;
  badgeLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  allowedFrom: ErpRequest['currentStatus'][];
}

const KANBAN_COLUMNS: KanbanColDef[] = [
  {
    id: 'Recebido',
    title: '1. Recebido',
    badgeLabel: 'Recebidos',
    color: '#475569',
    bgColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    icon: <Clock size={15} color="#475569" />,
    allowedFrom: ['Em triagem', 'Aguardando ajuste'],
  },
  {
    id: 'Em triagem',
    title: '2. Em Triagem',
    badgeLabel: 'Em Triagem',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    icon: <Search size={15} color="#0284C7" />,
    allowedFrom: ['Recebido', 'Aguardando ajuste', 'Falha na integração'],
  },
  {
    id: 'Aguardando ajuste',
    title: '3. Aguardando Ajuste',
    badgeLabel: 'Pendências',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    icon: <AlertTriangle size={15} color="#D97706" />,
    allowedFrom: ['Recebido', 'Em triagem'],
  },
  {
    id: 'Pronto para integração',
    title: '4. Pronto p/ Integração',
    badgeLabel: 'Pronto API',
    color: '#7C3AED',
    bgColor: '#FAF5FF',
    borderColor: '#DDD6FE',
    icon: <CheckCircle2 size={15} color="#7C3AED" />,
    allowedFrom: ['Em triagem', 'Falha na integração', 'Aguardando ajuste'],
  },
  {
    id: 'Em cadastro',
    title: '5. Em Cadastro ERP',
    badgeLabel: 'Enviando',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: <RefreshCw size={15} color="#2563EB" className="spin-slow" />,
    allowedFrom: ['Pronto para integração', 'Falha na integração'],
  },
  {
    id: 'Falha na integração',
    title: '6. Falha na Integração',
    badgeLabel: 'Erros ERP',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: <AlertCircle size={15} color="#DC2626" />,
    allowedFrom: ['Em cadastro', 'Pronto para integração'],
  },
  {
    id: 'Concluído',
    title: '7. Concluído',
    badgeLabel: 'Concluídos',
    color: '#059669',
    bgColor: '#F0FDF4',
    borderColor: '#A7F3D0',
    icon: <CheckCircle2 size={15} color="#059669" />,
    allowedFrom: ['Em cadastro', 'Pronto para integração', 'Em triagem'],
  },
];

// Mapeamento normalizado de status para coluna correspondente
function mapStatusToColId(status: ErpRequest['currentStatus']): ErpRequest['currentStatus'] {
  if (status === 'Aguardando informação' || status === 'Aguardando validação') {
    return 'Aguardando ajuste';
  }
  return status;
}

export const ErpKanban: React.FC = () => {
  const { openErpDrawer, setActiveNav, dataVersion, showToast, triggerRefresh, currentUser } = useApp();
  const [requests, setRequests] = useState<ErpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('Todas');
  const [analystFilter, setAnalystFilter] = useState('Todos');
  const [hideEmptyCols, setHideEmptyCols] = useState(false);
  const [compactView, setCompactView] = useState(false);

  // Drag & drop state
  const [draggedReqId, setDraggedReqId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/erp-requests')
      .then((r) => r.json())
      .then((data: ErpRequest[]) => {
        setRequests(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dataVersion]);

  // Lista única de unidades e analistas para filtros
  const units = useMemo(() => {
    const set = new Set(requests.map((r) => r.requestingUnit).filter(Boolean));
    return ['Todas', ...Array.from(set)];
  }, [requests]);

  const analysts = useMemo(() => {
    const set = new Set(requests.map((r) => r.assignedAnalyst).filter(Boolean) as string[]);
    return ['Todos', ...Array.from(set)];
  }, [requests]);

  // Filtragem
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.requestCode.toLowerCase().includes(q) ||
          r.supplierName.toLowerCase().includes(q) ||
          r.supplierCnpj.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (unitFilter !== 'Todas' && r.requestingUnit !== unitFilter) return false;
      if (analystFilter !== 'Todos' && r.assignedAnalyst !== analystFilter) return false;
      return true;
    });
  }, [requests, searchQuery, unitFilter, analystFilter]);

  // Transição de status validada
  const handleMoveStatus = async (
    reqId: string,
    newStatus: ErpRequest['currentStatus'],
    extraData?: { notes?: string; erpSupplierCode?: string; nextStep?: string }
  ) => {
    const targetReq = requests.find((r) => r.id === reqId);
    if (!targetReq) return;

    // Se estiver assumindo ou sem analista, vincula o usuário atual
    const assignedAnalyst =
      targetReq.assignedAnalyst || (currentUser ? currentUser.name : 'Roberto Valente (Governança)');

    try {
      const res = await fetch(`/api/erp-requests/${reqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          assignedAnalyst,
          userName: currentUser?.name || 'Governança & ERP',
          ...extraData,
        }),
      });

      if (!res.ok) throw new Error('Falha ao atualizar status');

      showToast(`Solicitação ${targetReq.requestCode} movida para "${newStatus}"!`, 'success');
      triggerRefresh();
    } catch {
      showToast('Erro ao atualizar status da solicitação.', 'error');
    }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, reqId: string) => {
    e.dataTransfer.setData('text/plain', reqId);
    setDraggedReqId(reqId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetColId: ErpRequest['currentStatus']) => {
    e.preventDefault();
    setDragOverCol(null);
    const reqId = e.dataTransfer.getData('text/plain') || draggedReqId;
    setDraggedReqId(null);

    if (!reqId) return;

    const req = requests.find((r) => r.id === reqId);
    if (!req) return;

    const currentNormalized = mapStatusToColId(req.currentStatus);
    if (currentNormalized === targetColId) return;

    // Validação de transição
    const colDef = KANBAN_COLUMNS.find((c) => c.id === targetColId);
    if (colDef && !colDef.allowedFrom.includes(currentNormalized)) {
      showToast(
        `Transição direta de "${currentNormalized}" para "${targetColId}" não recomendada na esteira de Governança.`,
        'warning'
      );
    }

    // Se movendo para concluído e não tem código ERP, gera um código demonstrativo
    let erpSupplierCode = req.erpSupplierCode;
    if (targetColId === 'Concluído' && !erpSupplierCode) {
      erpSupplierCode = `ERP-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    let nextStep = req.nextStep;
    if (targetColId === 'Concluído') nextStep = 'Cadastro concluído e sincronizado com Compras';
    if (targetColId === 'Pronto para integração') nextStep = 'Aguardando disparo da API do ERP';
    if (targetColId === 'Em cadastro') nextStep = 'Transmissão de payload fiscal em andamento';
    if (targetColId === 'Aguardando ajuste') nextStep = 'Aguardando retorno do comprador/fornecedor';
    if (targetColId === 'Em triagem') nextStep = 'Validação de dados fiscais e bancários';

    handleMoveStatus(reqId, targetColId, { erpSupplierCode, nextStep });
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando Quadro Kanban Operacional...</div>;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Topo da Página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Quadro Kanban Operacional
            </h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid #BFDBFE',
              }}
            >
              Governança & Integração ERP
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Esteira visual de 7 etapas da triagem cadastral ao retorno da API. Arraste os cards para mover o status.
          </p>
        </div>

        {/* Ações Topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setCompactView(!compactView)}
            style={{ fontSize: 12 }}
            title="Alternar entre visualização detalhada e compacta"
          >
            <SlidersHorizontal size={14} /> {compactView ? 'Modo Detalhado' : 'Modo Compacto'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveNav('erp-queue')}
            style={{ fontSize: 12 }}
          >
            <Table size={14} /> Fila em Tabela
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Opções */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280, flexWrap: 'wrap' }}>
          {/* Busca */}
          <div style={{ position: 'relative', minWidth: 220, flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar código, fornecedor, CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: 32, fontSize: 12, height: 34 }}
            />
          </div>

          {/* Filtro Investida */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Investida:</span>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="input"
              style={{ fontSize: 12, height: 34, padding: '4px 8px' }}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Analista */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Analista:</span>
            <select
              value={analystFilter}
              onChange={(e) => setAnalystFilter(e.target.value)}
              className="input"
              style={{ fontSize: 12, height: 34, padding: '4px 8px' }}
            >
              {analysts.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Checkbox ocultar colunas vazias */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={hideEmptyCols}
            onChange={(e) => setHideEmptyCols(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Ocultar colunas sem solicitações</span>
        </label>
      </div>

      {/* Grid das 7 Colunas Kanban com Scroll Horizontal Controlado */}
      <div
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(260px, 1fr)',
          gap: 14,
          overflowX: 'auto',
          paddingBottom: 16,
          alignItems: 'start',
          scrollbarWidth: 'thin',
        }}
      >
        {KANBAN_COLUMNS.map((col) => {
          const colRequests = filteredRequests.filter((r) => mapStatusToColId(r.currentStatus) === col.id);

          if (hideEmptyCols && colRequests.length === 0) {
            return null;
          }

          const isOverThisCol = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                backgroundColor: isOverThisCol ? '#EFF6FF' : '#F8FAFC',
                borderRadius: 10,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minHeight: 560,
                border: isOverThisCol ? '2px dashed #3B82F6' : `1px solid ${col.borderColor}`,
                transition: 'all 0.15s ease',
              }}
            >
              {/* Header da Coluna */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 8,
                  borderBottom: `2px solid ${col.color}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {col.icon}
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {col.title}
                  </span>
                </div>
                <span
                  style={{
                    backgroundColor: col.color,
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {colRequests.length}
                </span>
              </div>

              {/* Lista de Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {colRequests.length === 0 ? (
                  <div
                    style={{
                      padding: '28px 12px',
                      textAlign: 'center',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      border: '1px dashed var(--border-medium)',
                      borderRadius: 8,
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    Nenhuma solicitação nesta etapa
                  </div>
                ) : (
                  colRequests.map((req) => {
                    const isDelayed = req.currentStatus !== 'Concluído' && req.deadline < todayStr;
                    const pathCode = req.determinedFlow.replace(/Caminho\s*/i, '').trim() || 'A';

                    // Cores por caminho
                    const pathColorMap: Record<string, { bg: string; text: string; border: string }> = {
                      A: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
                      B: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
                      C: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
                      D: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
                    };
                    const pathStyle = pathColorMap[pathCode] || pathColorMap['A'];

                    return (
                      <div
                        key={req.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, req.id)}
                        className="card card-hoverable"
                        style={{
                          padding: compactView ? '10px' : '12px 14px',
                          cursor: 'grab',
                          borderLeft: `4px solid ${col.color}`,
                          backgroundColor: '#FFFFFF',
                          position: 'relative',
                          boxShadow: 'var(--shadow-xs)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                        onClick={() => openErpDrawer(req.id)}
                      >
                        {/* Topo do Card: Código + Caminho */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                            {req.requestCode}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              backgroundColor: pathStyle.bg,
                              color: pathStyle.text,
                              border: `1px solid ${pathStyle.border}`,
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {req.determinedFlow}
                          </span>
                        </div>

                        {/* Nome do Fornecedor & CNPJ */}
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 12.5,
                              color: 'var(--text-primary)',
                              lineHeight: 1.3,
                              marginBottom: 2,
                            }}
                          >
                            {req.supplierName}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {req.supplierCnpj}
                          </div>
                        </div>

                        {/* Investida & Categoria */}
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={12} color="var(--text-muted)" />
                          <span style={{ fontWeight: 600 }}>{req.requestingUnit}</span>
                          <span>•</span>
                          <span>{req.category}</span>
                        </div>

                        {/* Próxima Ação Resumida (se não compacto) */}
                        {!compactView && (
                          <div
                            style={{
                              fontSize: 11,
                              backgroundColor: '#F8FAFC',
                              padding: '5px 8px',
                              borderRadius: 6,
                              border: '1px solid #E2E8F0',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 5,
                            }}
                          >
                            <ChevronRight size={13} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ lineHeight: 1.3 }}>{req.nextStep || 'Aguardando conferência de dados cadastrais'}</span>
                          </div>
                        )}

                        {/* Código ERP (se concluído) */}
                        {req.erpSupplierCode && (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#059669',
                              backgroundColor: '#ECFDF5',
                              padding: '3px 8px',
                              borderRadius: 4,
                              border: '1px solid #A7F3D0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={12} /> Cód. ERP: {req.erpSupplierCode}
                          </div>
                        )}

                        {/* Rodapé: SLA + Analista */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: 6,
                            borderTop: '1px solid var(--border-subtle)',
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          {/* SLA */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              color: isDelayed ? '#DC2626' : 'var(--text-muted)',
                              fontWeight: isDelayed ? 700 : 500,
                            }}
                          >
                            {isDelayed ? <AlertTriangle size={12} color="#DC2626" /> : <Clock size={12} />}
                            <span>{formatDate(req.deadline)}</span>
                            {isDelayed && (
                              <span style={{ fontSize: 9, backgroundColor: '#FEE2E2', color: '#DC2626', padding: '0 4px', borderRadius: 2 }}>
                                ATRASO
                              </span>
                            )}
                          </div>

                          {/* Analista */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <UserCheck size={12} color={req.assignedAnalyst ? 'var(--color-primary)' : 'var(--text-muted)'} />
                            <span
                              style={{
                                color: req.assignedAnalyst ? 'var(--text-primary)' : '#DC2626',
                                fontWeight: req.assignedAnalyst ? 500 : 700,
                                fontSize: 10.5,
                              }}
                            >
                              {req.assignedAnalyst ? req.assignedAnalyst.split(' ')[0] : 'Não atribuído'}
                            </span>
                          </div>
                        </div>

                        {/* Botão de Ação Rápida */}
                        <div
                          style={{
                            marginTop: 4,
                            display: 'flex',
                            justifyContent: 'flex-end',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {col.id === 'Recebido' && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ fontSize: 10, padding: '3px 8px', height: 24 }}
                              onClick={() =>
                                handleMoveStatus(req.id, 'Em triagem', {
                                  nextStep: 'Conferindo dados cadastrais e fiscais',
                                })
                              }
                            >
                              Assumir & Iniciar <ArrowRight size={10} />
                            </button>
                          )}
                          {col.id === 'Em triagem' && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: 10, padding: '3px 8px', height: 24, color: '#7C3AED', borderColor: '#DDD6FE' }}
                              onClick={() =>
                                handleMoveStatus(req.id, 'Pronto para integração', {
                                  nextStep: 'Dados validados. Pronto para disparo via API ERP.',
                                })
                              }
                            >
                              Validar Dados <CheckCircle2 size={10} />
                            </button>
                          )}
                          {col.id === 'Pronto para integração' && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ fontSize: 10, padding: '3px 8px', height: 24, backgroundColor: '#2563EB' }}
                              onClick={() =>
                                handleMoveStatus(req.id, 'Em cadastro', {
                                  nextStep: 'Enviando payload para conector do ERP investida...',
                                })
                              }
                            >
                              Integrar ERP <Send size={10} />
                            </button>
                          )}
                          {col.id === 'Falha na integração' && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: 10, padding: '3px 8px', height: 24, color: '#DC2626', borderColor: '#FECACA' }}
                              onClick={() =>
                                handleMoveStatus(req.id, 'Pronto para integração', {
                                  nextStep: 'Tentando reenvio de payload após ajuste',
                                })
                              }
                            >
                              Tentar Novamente <RefreshCw size={10} />
                            </button>
                          )}
                          {col.id === 'Aguardando ajuste' && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: 10, padding: '3px 8px', height: 24, color: '#D97706' }}
                              onClick={() =>
                                handleMoveStatus(req.id, 'Em triagem', {
                                  nextStep: 'Retornando à triagem após esclarecimento',
                                })
                              }
                            >
                              Retomar Triagem <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé Informativo e Regras Sujeitas a Validação */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '10px 16px',
          backgroundColor: '#F8FAFC',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={14} color="var(--color-primary)" />
          <span>
            <strong>Fluxo de Integração:</strong> A conclusão do cadastro no ERP gera o código definitivo e sincroniza automaticamente a esteira de Compras.
          </span>
        </div>
        <span style={{ fontStyle: 'italic' }}>
          * Regras de transição, SLA e esteiras de integração demonstrativas, sujeitas à validação do negócio.
        </span>
      </div>
    </div>
  );
};
