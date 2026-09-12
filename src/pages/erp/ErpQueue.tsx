// ==============================================================================
// FILA OPERACIONAL DE SOLICITAÇÕES ERP - TIME DE CADASTRO
// Tabela operacional com SLA, analistas e fluxo determinado pela Matriz
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ErpRequest } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  Search,
  Filter,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  KanbanSquare,
  ArrowRight,
  UserCheck,
  RotateCcw,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';

export const ErpQueue: React.FC = () => {
  const { openErpDrawer, setActiveNav, dataVersion, erpQueueStatusFilter, setErpQueueStatusFilter } = useApp();
  const [requests, setRequests] = useState<ErpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(erpQueueStatusFilter || 'Todos');
  const [flowFilter, setFlowFilter] = useState('Todos');
  const [unitFilter, setUnitFilter] = useState('Todas');
  const [analystFilter, setAnalystFilter] = useState('Todos');
  const [slaFilter, setSlaFilter] = useState('Todos');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sincroniza se o filtro do contexto mudar (ex: clique no Dashboard)
  useEffect(() => {
    if (erpQueueStatusFilter) {
      setStatusFilter(erpQueueStatusFilter);
    }
  }, [erpQueueStatusFilter]);

  useEffect(() => {
    fetch('/api/erp-requests')
      .then((r) => r.json())
      .then((data: ErpRequest[]) => {
        setRequests(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dataVersion]);

  const nowStr = new Date().toISOString().split('T')[0];

  const filteredRequests = requests.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSupplier =
        r.supplierName.toLowerCase().includes(q) ||
        r.supplierCnpj.includes(q) ||
        r.requestCode.toLowerCase().includes(q) ||
        (r.erpSupplierCode && r.erpSupplierCode.toLowerCase().includes(q));
      if (!matchesSupplier) return false;
    }

    if (statusFilter !== 'Todos') {
      if (statusFilter === 'Aguardando ajuste' && (r.currentStatus === 'Aguardando informação' || r.currentStatus === 'Aguardando validação')) {
        // match
      } else if (r.currentStatus !== statusFilter) {
        return false;
      }
    }

    if (flowFilter !== 'Todos' && !r.determinedFlow.includes(flowFilter)) {
      return false;
    }

    if (unitFilter !== 'Todas' && r.requestingUnit !== unitFilter) {
      return false;
    }

    if (analystFilter !== 'Todos') {
      if (analystFilter === 'Não atribuído' && r.assignedAnalyst && r.assignedAnalyst !== 'Não atribuído') return false;
      if (analystFilter !== 'Não atribuído' && r.assignedAnalyst !== analystFilter) return false;
    }

    if (slaFilter !== 'Todos') {
      const isDelayed = r.currentStatus !== 'Concluído' && r.deadline < nowStr;
      if (slaFilter === 'Fora do SLA' && !isDelayed) return false;
      if (slaFilter === 'Dentro do SLA' && isDelayed) return false;
    }

    return true;
  });

  const getStatusBadge = (status: ErpRequest['currentStatus']) => {
    switch (status) {
      case 'Concluído':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Concluído</span>;
      case 'Em triagem':
        return <span className="badge badge-info"><Clock size={12} /> Em triagem</span>;
      case 'Pronto para integração':
        return <span className="badge badge-info" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}><Zap size={12} /> Pronto p/ Integração</span>;
      case 'Em cadastro':
        return <span className="badge badge-info"><Clock size={12} /> Em cadastro ERP</span>;
      case 'Falha na integração':
        return <span className="badge badge-danger"><AlertCircle size={12} /> Falha Integração</span>;
      case 'Recebido':
        return <span className="badge badge-neutral"><Clock size={12} /> Recebido</span>;
      case 'Aguardando ajuste':
      case 'Aguardando informação':
      case 'Aguardando validação':
        return <span className="badge badge-warning"><AlertTriangle size={12} /> Aguardando Ajuste</span>;
      case 'Cancelado':
        return <span className="badge badge-danger"><AlertCircle size={12} /> Cancelado</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const isDelayed = (deadline: string, status: string) => {
    if (status === 'Concluído' || status === 'Cancelado') return false;
    return deadline < nowStr;
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setStatusFilter('Todos');
    setFlowFilter('Todos');
    setUnitFilter('Todas');
    setAnalystFilter('Todos');
    setSlaFilter('Todos');
    setErpQueueStatusFilter('Todos');
  };

  const isAnyFilterActive =
    search ||
    statusFilter !== 'Todos' ||
    flowFilter !== 'Todos' ||
    unitFilter !== 'Todas' ||
    analystFilter !== 'Todos' ||
    slaFilter !== 'Todos';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Fila Operacional de Cadastramento ERP
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Demandas de criação de parceiros originadas de processos de sourcing e contratação do Grupo Plurix.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveNav('erp-kanban')}
          >
            <KanbanSquare size={15} /> Ver no Kanban
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              className="input-control"
              placeholder="Buscar por Fornecedor, CNPJ ou Cód. Solicitação..."
              style={{ paddingLeft: 38 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input-control"
            style={{ width: 'auto', minWidth: 160 }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setErpQueueStatusFilter(e.target.value);
            }}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Recebido">Recebido</option>
            <option value="Em triagem">Em triagem</option>
            <option value="Aguardando ajuste">Aguardando ajuste</option>
            <option value="Pronto para integração">Pronto para integração</option>
            <option value="Em cadastro">Em cadastro ERP</option>
            <option value="Falha na integração">Falha na integração</option>
            <option value="Concluído">Concluído</option>
          </select>

          <select
            className="input-control"
            style={{ width: 'auto', minWidth: 160 }}
            value={flowFilter}
            onChange={(e) => setFlowFilter(e.target.value)}
          >
            <option value="Todos">Todos os Caminhos</option>
            <option value="Caminho A">Caminho A (Simplificado)</option>
            <option value="Caminho B">Caminho B (Pleno / Legal)</option>
            <option value="Caminho C">Caminho C (Validação Rápida)</option>
            <option value="Caminho D">Caminho D (Aditivo / Novo)</option>
          </select>

          <button
            type="button"
            className={`btn ${showAdvanced ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <SlidersHorizontal size={14} /> Filtros
          </button>

          {isAnyFilterActive && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClearAllFilters}
              title="Limpar todos os filtros"
            >
              <RotateCcw size={13} /> Limpar
            </button>
          )}
        </div>

        {/* Linha de Filtros Avançados */}
        {showAdvanced && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <label className="form-label" style={{ fontSize: 11 }}>Investida / Unidade</label>
              <select
                className="input-control"
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
              >
                <option value="Todas">Todas as Investidas</option>
                <option value="Unidade Corporativa SP">Unidade Corporativa SP</option>
                <option value="CD Central Arujá">CD Central Arujá</option>
                <option value="CD Regional Ribeirão">CD Regional Ribeirão</option>
                <option value="Bandeira Super Sul">Bandeira Super Sul</option>
                <option value="Bandeira Mais Você">Bandeira Mais Você</option>
                <option value="Hiper Plurix Campinas">Hiper Plurix Campinas</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11 }}>Analista Responsável</label>
              <select
                className="input-control"
                value={analystFilter}
                onChange={(e) => setAnalystFilter(e.target.value)}
              >
                <option value="Todos">Todos os Analistas</option>
                <option value="Roberto Valente">Roberto Valente</option>
                <option value="Não atribuído">Não atribuído</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 11 }}>Cumprimento de SLA</label>
              <select
                className="input-control"
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value)}
              >
                <option value="Todos">Todos os Prazos</option>
                <option value="Dentro do SLA">Dentro do SLA</option>
                <option value="Fora do SLA">Fora do SLA (Atrasado)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Solicitações */}
      <div className="table-container">
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Exibindo <strong>{filteredRequests.length}</strong> de {requests.length} solicitações na fila</span>
          <span>Clique em qualquer linha para abrir o Painel de Atendimento</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando fila operacional...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Building2 size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Fila operacional ERP limpa</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Nenhuma solicitação de cadastro pendente no momento. Novas requisições surgirão automaticamente quando o time de Compras homologar/premiar fornecedores.
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma solicitação encontrada com os filtros selecionados.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código / Data</th>
                <th>Fornecedor / CNPJ</th>
                <th>Investida / Categoria</th>
                <th>Caminho</th>
                <th>Status Atual</th>
                <th>SLA / Prazo</th>
                <th>Analista</th>
                <th>Próxima Ação</th>
                <th style={{ textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const delayed = isDelayed(req.deadline, req.currentStatus);

                return (
                  <tr
                    key={req.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openErpDrawer(req.id)}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {req.requestCode}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatDate(req.createdAt)}
                      </div>
                    </td>

                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {req.supplierName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {req.supplierCnpj}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{req.requestingUnit}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{req.category}</div>
                    </td>

                    <td>
                      <span
                        style={{
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {req.determinedFlow}
                      </span>
                    </td>

                    <td>{getStatusBadge(req.currentStatus)}</td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {delayed && <AlertCircle size={13} color="var(--status-danger)" />}
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: delayed ? 700 : 500,
                            color: delayed ? 'var(--status-danger)' : 'var(--text-primary)',
                          }}
                        >
                          {formatDate(req.deadline)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <UserCheck size={13} color="var(--color-accent)" />
                        <span>{req.assignedAnalyst || 'Não atribuído'}</span>
                      </div>
                    </td>

                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.nextStep || 'Triagem cadastral'}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openErpDrawer(req.id)}
                      >
                        <Eye size={13} /> Atender
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
