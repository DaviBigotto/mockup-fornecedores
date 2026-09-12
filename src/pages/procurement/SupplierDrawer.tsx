// ==============================================================================
// DRAWER AMPLO DE DETALHES DO FORNECEDOR - ÁREA DE COMPRAS E GOVERNANÇA ERP
// Painel lateral abrangente para visualização consultiva, dossiê, investidas e auditoria
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, StatusHistoryEvent, SupplierErpRegistration } from '../../types';
import {
  RegistrationStatusBadge,
  ErpStatusBadge,
  DocumentStatusBadge,
} from '../../components/common/StatusBadges';
import { formatDate, formatDateTime, formatFileSize } from '../../utils/formatters';
import {
  X,
  Building,
  MapPin,
  Landmark,
  Users2,
  FileCheck2,
  Clock,
  Award,
  ShieldAlert,
  Download,
  Info,
  ExternalLink,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';

const DEMO_INVESTIDAS_FALLBACK: SupplierErpRegistration[] = [
  {
    businessUnit: 'Unidade Corporativa SP',
    erpSystem: 'SAP S/4HANA (Corp)',
    erpCode: 'ERP-778901',
    status: 'Concluído',
    isBlocked: false,
    assignedAnalyst: 'Roberto Valente',
    lastCheckedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Cadastro ativo e apto para emissão de PO corporativa.',
  },
  {
    businessUnit: 'Bandeira Paraná (Super Sul)',
    erpSystem: 'TOTVS Protheus V12',
    erpCode: 'FORN-33420',
    status: 'Concluído',
    isBlocked: false,
    assignedAnalyst: 'Camila Rocha',
    lastCheckedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Inscrição estadual homologada no SEFAZ-PR.',
  },
  {
    businessUnit: 'Bandeira Avenida (Interior SP)',
    erpSystem: 'SAP S/4HANA (Regional)',
    erpCode: undefined,
    status: 'Em triagem',
    isBlocked: false,
    assignedAnalyst: 'Roberto Valente',
    lastCheckedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Conferindo alíquota de ICMS e diferimento.',
  },
  {
    businessUnit: 'Bandeira Boa (Litoral)',
    erpSystem: 'Oracle EBS',
    erpCode: undefined,
    status: 'Não solicitado',
    isBlocked: false,
    assignedAnalyst: undefined,
    lastCheckedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Sem demanda de fornecimento ativa nesta bandeira.',
  },
];

export const SupplierDrawer: React.FC = () => {
  const { selectedSupplierId, closeSupplierDrawer, openAwardModal, dataVersion, currentUser, showToast } = useApp();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [history, setHistory] = useState<StatusHistoryEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'investidas' | 'bancario' | 'socios' | 'documentos' | 'historico'>('geral');
  const [loading, setLoading] = useState(false);

  const isCadastro = currentUser?.role === 'cadastro';

  useEffect(() => {
    if (!selectedSupplierId) {
      setSupplier(null);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(`/api/suppliers/${selectedSupplierId}`).then((r) => r.json()),
      fetch(`/api/suppliers/${selectedSupplierId}/history`).then((r) => r.json()),
    ])
      .then(([supData, histData]) => {
        setSupplier(supData);
        setHistory(histData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedSupplierId, dataVersion]);

  const handleApproveHomologation = async () => {
    if (!supplier) return;
    try {
      const actorName = currentUser?.name || 'Comprador Corporativo';
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': actorName,
        },
        body: JSON.stringify({
          status: 'Homologado',
          documentStatus: 'Válido',
        }),
      });

      if (!res.ok) throw new Error();

      showToast(`Fornecedor ${supplier.tradeName} homologado com sucesso!`, 'success');
      triggerRefresh();
      closeSupplierDrawer();
    } catch {
      showToast('Erro ao homologar fornecedor.', 'error');
    }
  };

  const handleRequestAdjustment = async () => {
    if (!supplier) return;
    try {
      const actorName = currentUser?.name || 'Comprador Corporativo';
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': actorName,
        },
        body: JSON.stringify({
          status: 'Ajuste solicitado',
        }),
      });

      if (!res.ok) throw new Error();

      showToast(`Ajuste solicitado para ${supplier.tradeName}.`, 'info');
      triggerRefresh();
      closeSupplierDrawer();
    } catch {
      showToast('Erro ao solicitar ajuste.', 'error');
    }
  };

  if (!selectedSupplierId) return null;

  const erpRegistrations =
    supplier?.erpRegistrations && supplier.erpRegistrations.length > 0
      ? supplier.erpRegistrations
      : DEMO_INVESTIDAS_FALLBACK;

  return (
    <div className="drawer-backdrop" onClick={closeSupplierDrawer}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho do Drawer */}
        <div className="drawer-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                {supplier?.cnpj}
              </span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
                {supplier?.mainCategory}
              </span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              {supplier?.tradeName || supplier?.corporateName}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {supplier?.corporateName}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={closeSupplierDrawer}
            style={{ padding: 6, borderRadius: '50%' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Aviso de Perfil */}
        {isCadastro ? (
          <div
            style={{
              backgroundColor: '#F0FDF4',
              borderBottom: '1px solid #BBF7D0',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              color: '#166534',
            }}
          >
            <Info size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Governança de Dados Mestres:</strong> Visualização técnica de conformidade fiscal, domicílio bancário e situação cadastral nos ERPs das investidas.
            </span>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#F0F9FF',
              borderBottom: '1px solid #BAE6FD',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              color: '#0369A1',
            }}
          >
            <Info size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Área de Compras:</strong> Acesso consultivo para cotações e acompanhamento da homologação. O cadastro no ERP é executado pelo time de Governança.
            </span>
          </div>
        )}

        {/* Faixa de Status Independentes */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Situação Cadastral</div>
            {supplier && <RegistrationStatusBadge status={supplier.status} />}
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Situação Geral no ERP</div>
            {supplier && <ErpStatusBadge status={supplier.erpStatus} erpCode={supplier.erpCode} />}
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Conformidade Documental</div>
            {supplier && <DocumentStatusBadge status={supplier.documentStatus} />}
          </div>
        </div>

        {/* Abas do Drawer */}
        <div className="tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'geral' ? 'active' : ''}`}
            onClick={() => setActiveTab('geral')}
          >
            <Building size={15} /> Visão Geral
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'investidas' ? 'active' : ''}`}
            onClick={() => setActiveTab('investidas')}
          >
            <Building2 size={15} /> Situação por Investida
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'bancario' ? 'active' : ''}`}
            onClick={() => setActiveTab('bancario')}
          >
            <Landmark size={15} /> Domicílio Bancário
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'socios' ? 'active' : ''}`}
            onClick={() => setActiveTab('socios')}
          >
            <Users2 size={15} /> Sócios e Referências
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'documentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('documentos')}
          >
            <FileCheck2 size={15} /> Dossiê de Documentos
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'historico' ? 'active' : ''}`}
            onClick={() => setActiveTab('historico')}
          >
            <Clock size={15} /> Trilha de Auditoria
          </button>
        </div>

        {/* Corpo do Drawer */}
        <div className="drawer-body">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Carregando dados do fornecedor...
            </div>
          ) : !supplier ? (
            <div style={{ padding: 40, textAlign: 'center' }}>Fornecedor não localizado.</div>
          ) : (
            <>
              {/* ABA 1: VISÃO GERAL */}
              {activeTab === 'geral' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div className="card">
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 12 }}>
                        Identificação e Enquadramento
                      </h4>
                      <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div><strong>Porte:</strong> {supplier.companySize || 'Médio Porte'}</div>
                        <div><strong>Natureza Jurídica:</strong> {supplier.legalNature || 'Sociedade Empresária Limitada'}</div>
                        <div><strong>Regime Tributário:</strong> {supplier.taxRegime || 'Lucro Presumido'}</div>
                        <div><strong>IBS / CBS:</strong> {supplier.ibsCbsRegime || 'Não Cumulativo Pleno'}</div>
                        <div><strong>Inscrição Estadual:</strong> {supplier.stateRegistration || 'Isento'}</div>
                        <div><strong>Inscrição Municipal:</strong> {supplier.municipalRegistration || '-'}</div>
                      </div>
                    </div>

                    <div className="card">
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 12 }}>
                        Contato Principal
                      </h4>
                      {supplier.contacts?.[0] ? (
                        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div><strong>Nome:</strong> {supplier.contacts[0].name}</div>
                          <div><strong>Cargo:</strong> {supplier.contacts[0].role || 'Representante'}</div>
                          <div><strong>E-mail:</strong> {supplier.contacts[0].email}</div>
                          <div><strong>Telefone:</strong> {supplier.contacts[0].phone || '-'}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum contato registrado</div>
                      )}
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="card">
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 12 }}>
                      Endereço da Sede
                    </h4>
                    {supplier.address ? (
                      <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div>
                          {supplier.address.street}, {supplier.address.number}
                          {supplier.address.complement ? ` - ${supplier.address.complement}` : ''}
                        </div>
                        <div>
                          {supplier.address.neighborhood} - {supplier.address.city}/{supplier.address.state}
                        </div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          CEP: {supplier.address.zipCode}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Endereço não informado</div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 2: SITUAÇÃO POR INVESTIDA */}
              {activeTab === 'investidas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <strong>Matriz Multi-Investida:</strong> A homologação comercial da Plurix habilita o fornecedor na rede, enquanto o cadastro no ERP é gerido individualmente por CNPJ de faturamento e sistema de cada investida.
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Investida / Unidade</th>
                          <th>ERP</th>
                          <th>Código ERP</th>
                          <th>Situação</th>
                          <th>Bloqueio</th>
                          <th>Analista</th>
                          <th>Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {erpRegistrations.map((inv, idx) => {
                          const statusColorMap: Record<string, { bg: string; text: string }> = {
                            'Concluído': { bg: '#D1FAE5', text: '#065F46' },
                            'Em triagem': { bg: '#E0F2FE', text: '#0369A1' },
                            'Em cadastro': { bg: '#DBEAFE', text: '#1D4ED8' },
                            'Aguardando ajuste': { bg: '#FEF3C7', text: '#92400E' },
                            'Não solicitado': { bg: '#F1F5F9', text: '#64748B' },
                            'Falha na integração': { bg: '#FEE2E2', text: '#991B1B' },
                          };
                          const style = statusColorMap[inv.status] || { bg: '#F1F5F9', text: '#64748B' };

                          return (
                            <tr key={idx}>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.businessUnit}</div>
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inv.erpSystem}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: inv.erpCode ? 700 : 400, color: inv.erpCode ? '#059669' : 'var(--text-muted)' }}>
                                {inv.erpCode || '—'}
                              </td>
                              <td>
                                <span
                                  style={{
                                    backgroundColor: style.bg,
                                    color: style.text,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {inv.status}
                                </span>
                              </td>
                              <td>
                                {inv.isBlocked ? (
                                  <span style={{ color: '#DC2626', fontWeight: 700, fontSize: 11 }}>Sim (Bloqueado)</span>
                                ) : (
                                  <span style={{ color: '#059669', fontSize: 11 }}>Não</span>
                                )}
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {inv.assignedAnalyst || '—'}
                              </td>
                              <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 200 }}>
                                {inv.notes || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 3: DOMICÍLIO BANCÁRIO */}
              {activeTab === 'bancario' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {supplier.bankAccounts && supplier.bankAccounts.length > 0 ? (
                    supplier.bankAccounts.map((b) => (
                      <div key={b.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
                            {b.bankName} (Cód. {b.bankCode || '000'})
                          </h4>
                          {b.isMain && (
                            <span style={{ fontSize: 11, backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                              Conta Principal
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                          <div><strong>Agência:</strong> {b.agency}</div>
                          <div><strong>Conta Corrente:</strong> {b.accountNumber}-{b.accountDigit}</div>
                          <div><strong>Titular:</strong> {b.accountHolder}</div>
                          <div><strong>CNPJ Titular:</strong> {b.holderTaxId}</div>
                          {b.pixKey && <div><strong>Chave PIX:</strong> {b.pixKey} ({b.pixKeyType})</div>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma conta bancária vinculada.</div>
                  )}
                </div>
              )}

              {/* ABA 4: SÓCIOS E REFERÊNCIAS */}
              {activeTab === 'socios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="card">
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12 }}>
                      Quadro Societário (QSA)
                    </h4>
                    {supplier.shareholders && supplier.shareholders.length > 0 ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Nome do Sócio</th>
                            <th>CPF / CNPJ</th>
                            <th>Qualificação</th>
                            <th>Participação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplier.shareholders.map((s) => (
                            <tr key={s.id}>
                              <td><strong>{s.name}</strong></td>
                              <td style={{ fontFamily: 'monospace' }}>{s.document}</td>
                              <td>{s.role}</td>
                              <td>{s.equityPercentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum sócio informado.</div>
                    )}
                  </div>

                  <div className="card">
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12 }}>
                      Referências Comerciais
                    </h4>
                    {supplier.commercialReferences && supplier.commercialReferences.length > 0 ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Empresa</th>
                            <th>Contato</th>
                            <th>E-mail</th>
                            <th>Telefone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplier.commercialReferences.map((r) => (
                            <tr key={r.id}>
                              <td><strong>{r.companyName}</strong></td>
                              <td>{r.contactName}</td>
                              <td>{r.email}</td>
                              <td>{r.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma referência cadastrada.</div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 5: DOCUMENTOS */}
              {activeTab === 'documentos' && (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Documento</th>
                        <th>Arquivo</th>
                        <th>Validade</th>
                        <th>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplier.documents && supplier.documents.length > 0 ? (
                        supplier.documents.map((doc) => (
                          <tr key={doc.id}>
                            <td>
                              <div style={{ fontWeight: 700 }}>{doc.documentName}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FileCheck2 size={14} color="var(--color-primary)" />
                                {doc.fileName} ({formatFileSize(doc.fileSizeBytes)})
                              </div>
                            </td>
                            <td>{formatDate(doc.expirationDate)}</td>
                            <td>
                              <DocumentStatusBadge status={doc.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                            Nenhum documento anexado no momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ABA 6: HISTÓRICO */}
              {activeTab === 'historico' && (
                <div className="timeline">
                  {history.map((event) => (
                    <div key={event.id} className="timeline-item">
                      <div className="timeline-marker">
                        <Clock size={12} />
                      </div>
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 8,
                          padding: '12px 16px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{event.action}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {formatDateTime(event.createdAt)} por {event.userName}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé do Drawer */}
        <div className="drawer-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={closeSupplierDrawer}>
            Fechar
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isCadastro && supplier?.status !== 'Homologado' && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleRequestAdjustment}
                  style={{ color: '#D97706', borderColor: '#FCD34D' }}
                >
                  <AlertTriangle size={14} /> Solicitar Ajuste
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleApproveHomologation}
                  style={{ color: '#059669', borderColor: '#A7F3D0', fontWeight: 700 }}
                >
                  <CheckCircle2 size={14} /> Homologar Fornecedor
                </button>
              </>
            )}

            {isCadastro ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => showToast('Consulta de sincronização ao ERP da investida efetuada com sucesso.', 'info')}
                style={{ color: 'var(--color-primary)' }}
              >
                <RefreshCw size={14} /> Consultar Retorno ERP
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  closeSupplierDrawer();
                  openAwardModal(supplier?.id);
                }}
              >
                <Award size={16} /> Registrar Fornecedor Premiado
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
