// ==============================================================================
// TRILHA DE AUDITORIA E LOGS DE INTEGRAÇÃO ERP - GOVERNANÇA E ERP
// Registro cronológico, consultivo, pesquisável e exportável para compliance
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusHistoryEvent, Supplier } from '../../types';
import { formatDateTime, formatDate } from '../../utils/formatters';
import {
  Clock,
  ShieldCheck,
  Database,
  ArrowRight,
  UserCheck,
  Search,
  Filter,
  Download,
  RotateCcw,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';

export const ErpHistory: React.FC = () => {
  const { dataVersion, showToast, openSupplierDrawer } = useApp();
  const [events, setEvents] = useState<StatusHistoryEvent[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState('Todos');
  const [eventFilter, setEventFilter] = useState('Todos');
  const [periodFilter, setPeriodFilter] = useState('Todos');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/history').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/suppliers').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([histData, supData]) => {
        setEvents(Array.isArray(histData) ? histData : []);
        setSuppliers(Array.isArray(supData) ? supData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dataVersion]);

  // Mapa rápido de ID para Fornecedor
  const supplierMap = useMemo(() => {
    const map = new Map<string, Supplier>();
    suppliers.forEach((s) => map.set(s.id, s));
    return map;
  }, [suppliers]);

  // Filtragem dos eventos
  const filteredEvents = useMemo(() => {
    const now = Date.now();

    return events.filter((ev) => {
      // Busca Textual
      if (search.trim()) {
        const q = search.toLowerCase();
        const sup = supplierMap.get(ev.supplierId);
        const matchAction = ev.action.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q) || false;
        const matchUser = ev.userName.toLowerCase().includes(q);
        const matchSup = sup
          ? sup.corporateName.toLowerCase().includes(q) ||
            sup.tradeName.toLowerCase().includes(q) ||
            sup.cnpj.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
          : false;

        if (!matchAction && !matchDesc && !matchUser && !matchSup) return false;
      }

      // Perfil
      if (profileFilter !== 'Todos' && ev.profile !== profileFilter) return false;

      // Tipo de Evento
      if (eventFilter !== 'Todos' && ev.eventType !== eventFilter) return false;

      // Período
      if (periodFilter !== 'Todos') {
        const evTime = new Date(ev.createdAt).getTime();
        if (periodFilter === '24h' && now - evTime > 24 * 60 * 60 * 1000) return false;
        if (periodFilter === '7d' && now - evTime > 7 * 24 * 60 * 60 * 1000) return false;
        if (periodFilter === '30d' && now - evTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [events, search, profileFilter, eventFilter, periodFilter, supplierMap]);

  // Tipos únicos de eventos
  const eventTypes = useMemo(() => {
    const set = new Set(events.map((e) => e.eventType).filter(Boolean));
    return ['Todos', ...Array.from(set)];
  }, [events]);

  const handleExportCsv = () => {
    const headers = [
      'Data e Hora',
      'Perfil/Origem',
      'Usuário',
      'Ação',
      'Tipo de Evento',
      'Fornecedor Relacionado',
      'CNPJ',
      'Status Anterior',
      'Novo Status',
      'Descrição Detalhada',
    ];

    const rows = filteredEvents.map((ev) => {
      const sup = supplierMap.get(ev.supplierId);
      return [
        `"${formatDateTime(ev.createdAt)}"`,
        `"${ev.profile}"`,
        `"${ev.userName}"`,
        `"${ev.action}"`,
        `"${ev.eventType}"`,
        `"${sup?.corporateName || ev.supplierId}"`,
        `"${sup?.cnpj || ''}"`,
        `"${ev.previousStatus || ''}"`,
        `"${ev.newStatus || ''}"`,
        `"${(ev.description || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_governanca_erp_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Trilha de auditoria exportada com ${filteredEvents.length} registros!`, 'success');
  };

  const handleClearFilters = () => {
    setSearch('');
    setProfileFilter('Todos');
    setEventFilter('Todos');
    setPeriodFilter('Todos');
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando logs de auditoria...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Logs de Governança e Auditoria ERP
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
              Imutável & Rastreável
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Trilha completa de auditoria das transições cadastrais, pareceres de triagem, payloads de integração e emissão de códigos ERP.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 3 }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('table')}
              style={{ fontSize: 12, padding: '4px 10px', height: 28 }}
            >
              Tabela
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('timeline')}
              style={{ fontSize: 12, padding: '4px 10px', height: 28 }}
            >
              Linha do Tempo
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCsv}
            title="Exportar registros filtrados para CSV"
            style={{ fontSize: 12 }}
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Busca Textual */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-control"
              placeholder="Buscar por ação, fornecedor, CNPJ, usuário ou texto..."
              style={{ paddingLeft: 36, fontSize: 13 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filtro Perfil / Origem */}
          <select
            className="input-control"
            style={{ width: 'auto', minWidth: 160, fontSize: 12 }}
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
          >
            <option value="Todos">Todas as Origens</option>
            <option value="Governança & ERP">Governança & ERP</option>
            <option value="Time de Cadastro">Time de Cadastro</option>
            <option value="Compras">Área de Compras</option>
            <option value="Fornecedor">Portal do Fornecedor</option>
            <option value="Sistema Organizer">Sistema / Conectores</option>
          </select>

          {/* Filtro Período */}
          <select
            className="input-control"
            style={{ width: 'auto', minWidth: 150, fontSize: 12 }}
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="Todos">Todo o Período</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>

          {/* Filtro Tipo de Evento */}
          <button
            type="button"
            className={`btn ${showAdvanced ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ fontSize: 12 }}
          >
            <SlidersHorizontal size={13} /> {showAdvanced ? 'Menos Filtros' : 'Mais Filtros'}
          </button>

          {(search || profileFilter !== 'Todos' || eventFilter !== 'Todos' || periodFilter !== 'Todos') && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClearFilters}
              title="Limpar filtros"
              style={{ fontSize: 12 }}
            >
              <RotateCcw size={13} /> Limpar
            </button>
          )}
        </div>

        {/* Linha Avançada */}
        {showAdvanced && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Tipo Técnico do Evento:</span>
              <select
                className="input-control"
                style={{ width: 'auto', minWidth: 200, fontSize: 12 }}
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              >
                {eventTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Visualização em Tabela ou Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', backgroundColor: '#FFFFFF' }}>
          <ShieldCheck size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Nenhum evento localizado</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Tente ajustar os critérios de busca ou filtros aplicados.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="table-container">
          <div
            style={{
              padding: '10px 18px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <span>Exibindo <strong>{filteredEvents.length}</strong> eventos de auditoria</span>
            <span style={{ fontSize: 11, fontStyle: 'italic' }}>* Registros cronológicos protegidos contra edição manual</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Origem / Perfil</th>
                <th>Usuário / Sistema</th>
                <th>Ação / Evento</th>
                <th>Fornecedor</th>
                <th>Transição de Status</th>
                <th>Detalhamento</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => {
                const sup = supplierMap.get(ev.supplierId);

                // Badge perfil
                const profileColorMap: Record<string, { bg: string; text: string }> = {
                  'Compras': { bg: '#EFF6FF', text: '#1D4ED8' },
                  'Time de Cadastro': { bg: '#F0FDF4', text: '#15803D' },
                  'Governança & ERP': { bg: '#F0FDF4', text: '#15803D' },
                  'Fornecedor': { bg: '#FAF5FF', text: '#7C3AED' },
                  'Sistema Organizer': { bg: '#F1F5F9', text: '#475569' },
                };
                const style = profileColorMap[ev.profile] || { bg: '#F1F5F9', text: '#475569' };

                return (
                  <tr key={ev.id}>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} color="var(--text-muted)" />
                        <span>{formatDateTime(ev.createdAt)}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {ev.profile}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ev.userName}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {ev.action}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {ev.eventType}
                      </div>
                    </td>

                    <td style={{ maxWidth: 220 }}>
                      {sup ? (
                        <div
                          style={{ cursor: 'pointer' }}
                          onClick={() => openSupplierDrawer(sup.id)}
                          title="Clique para abrir detalhes do fornecedor"
                        >
                          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-primary)' }}>
                            {sup.tradeName || sup.corporateName}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {sup.cnpj}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {ev.supplierId}
                        </span>
                      )}
                    </td>

                    <td>
                      {ev.previousStatus || ev.newStatus ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)', textDecoration: ev.previousStatus ? 'line-through' : 'none' }}>
                            {ev.previousStatus || '—'}
                          </span>
                          <ArrowRight size={11} color="var(--color-primary)" />
                          <span style={{ fontWeight: 700, color: '#059669' }}>{ev.newStatus}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>—</span>
                      )}
                    </td>

                    <td style={{ maxWidth: 280, fontSize: 12, color: 'var(--text-secondary)' }}>
                      {ev.description || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Visualização em Linha do Tempo */
        <div className="card" style={{ padding: '28px 24px', backgroundColor: '#FFFFFF' }}>
          <div className="timeline">
            {filteredEvents.map((ev) => {
              const sup = supplierMap.get(ev.supplierId);

              return (
                <div key={ev.id} className="timeline-item">
                  <div className="timeline-marker">
                    <Database size={12} />
                  </div>
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: 8,
                      padding: '14px 18px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            backgroundColor: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                          }}
                        >
                          {ev.profile}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{ev.action}</span>
                        {sup && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--color-primary)',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                            onClick={() => openSupplierDrawer(sup.id)}
                          >
                            • {sup.tradeName || sup.corporateName}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatDateTime(ev.createdAt)} • {ev.userName}
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
                      {ev.description}
                    </p>

                    {ev.previousStatus && ev.newStatus && (
                      <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                        <span>Status anterior: <strong>{ev.previousStatus}</strong></span>
                        <ArrowRight size={10} />
                        <span style={{ color: '#059669' }}>Novo status: <strong>{ev.newStatus}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rodapé Informativo */}
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
          <ShieldCheck size={14} color="#059669" />
          <span>
            <strong>Auditoria e Compliance:</strong> Todas as alterações de dados fiscais, bancários e de homologação geram hash de integridade para trilha de governança.
          </span>
        </div>
        <span style={{ fontStyle: 'italic' }}>
          * Registros demonstrativos para homologação do protótipo Plurix Organizer.
        </span>
      </div>
    </div>
  );
};
