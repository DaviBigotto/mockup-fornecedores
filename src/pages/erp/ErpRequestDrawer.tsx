// ==============================================================================
// PAINEL DE ATENDIMENTO CADASTRAL & INTEGRAÇÃO ERP - TIME DE GOVERNANÇA & ERP
// Interface operacional completa: triagem, validação fiscal/bancária, investidas e integração
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ErpRequest, Supplier, StatusHistoryEvent, SupplierErpRegistration } from '../../types';
import { formatDate, formatDateTime, formatCurrency, formatFileSize } from '../../utils/formatters';
import { DocumentStatusBadge } from '../../components/common/StatusBadges';
import {
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Database,
  UserCheck,
  FileCheck2,
  ShieldCheck,
  AlertCircle,
  Zap,
  Landmark,
  Building,
  RotateCcw,
  Tag,
  ArrowRight,
  UserX,
  Info,
} from 'lucide-react';

export const ErpRequestDrawer: React.FC = () => {
  const { selectedErpRequestId, closeErpDrawer, showToast, triggerRefresh, dataVersion } = useApp();
  const [request, setRequest] = useState<ErpRequest | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [history, setHistory] = useState<StatusHistoryEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'triagem' | 'dados' | 'documentos' | 'investidas' | 'historico'>('triagem');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [status, setStatus] = useState<ErpRequest['currentStatus']>('Recebido');
  const [assignedAnalyst, setAssignedAnalyst] = useState('Roberto Valente');
  const [erpSupplierCode, setErpSupplierCode] = useState('');
  const [notes, setNotes] = useState('');
  const [nextStep, setNextStep] = useState('');

  useEffect(() => {
    if (!selectedErpRequestId) {
      setRequest(null);
      setSupplier(null);
      setHistory([]);
      return;
    }

    setLoading(true);
    fetch(`/api/erp-requests/${selectedErpRequestId}`)
      .then((r) => r.json())
      .then((reqData: ErpRequest) => {
        setRequest(reqData);
        setStatus(reqData.currentStatus);
        setAssignedAnalyst(reqData.assignedAnalyst || 'Roberto Valente');
        setErpSupplierCode(reqData.erpSupplierCode || '');
        setNotes(reqData.notes || '');
        setNextStep(reqData.nextStep || '');

        if (reqData.supplierId) {
          Promise.all([
            fetch(`/api/suppliers/${reqData.supplierId}`).then((res) => res.json()),
            fetch(`/api/suppliers/${reqData.supplierId}/history`).then((res) => res.json()),
          ]).then(([sup, hist]) => {
            setSupplier(sup);
            setHistory(hist);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [selectedErpRequestId, dataVersion]);

  const handleQuickStatusTransition = async (
    newStatus: ErpRequest['currentStatus'],
    newNextStep?: string,
    defaultNotes?: string
  ) => {
    if (!request) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/erp-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          assignedAnalyst,
          erpSupplierCode: erpSupplierCode.trim() || undefined,
          notes: defaultNotes || notes,
          nextStep: newNextStep || nextStep,
          userName: 'Roberto Valente (Governança ERP)',
        }),
      });

      if (!res.ok) throw new Error('Falha ao atualizar status');

      setStatus(newStatus);
      if (newNextStep) setNextStep(newNextStep);
      showToast(`Solicitação atualizada para "${newStatus}"!`, 'success');
      triggerRefresh();
    } catch {
      showToast('Erro ao atualizar solicitação na fila ERP.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!request) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/erp-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          assignedAnalyst,
          erpSupplierCode: erpSupplierCode.trim() || undefined,
          notes,
          nextStep,
          userName: 'Roberto Valente (Governança ERP)',
        }),
      });

      if (!res.ok) throw new Error('Falha ao salvar alterações');

      showToast('Alterações salvas com sucesso!', 'success');
      triggerRefresh();
      closeErpDrawer();
    } catch {
      showToast('Erro ao atualizar solicitação.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConcludeErpRegistration = async () => {
    if (!request) return;
    if (!erpSupplierCode.trim()) {
      showToast('É obrigatório preencher o Código do Fornecedor gerado no ERP antes de concluir.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/erp-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Concluído',
          assignedAnalyst,
          erpSupplierCode: erpSupplierCode.trim(),
          notes: notes || 'Cadastro concluído e ativo nos módulos de Compras e Financeiro do Protheus/SAP.',
          nextStep: 'Apto para emissão de Ordem de Compra',
          userName: 'Roberto Valente (Governança ERP)',
        }),
      });

      if (!res.ok) throw new Error('Falha ao concluir cadastro');

      showToast(
        `Cadastro no ERP finalizado com sucesso! Código ${erpSupplierCode} atribuído. Fornecedor liberado para Compras.`,
        'success'
      );
      triggerRefresh();
      closeErpDrawer();
    } catch {
      showToast('Erro ao concluir cadastro no ERP.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedErpRequestId) return null;

  // Investidas demonstrativas
  const investidasList: SupplierErpRegistration[] = [
    {
      businessUnit: request?.requestingUnit || 'Unidade Corporativa SP',
      erpSystem: 'Protheus 12',
      erpCode: erpSupplierCode || request?.erpSupplierCode || undefined,
      status: status === 'Concluído' ? 'Concluído' : status === 'Em cadastro' ? 'Em cadastro ERP' : status === 'Falha na integração' ? 'Falha na integração' : 'Em triagem',
      isBlocked: false,
      updatedAt: request?.updatedAt || new Date().toISOString(),
    },
    {
      businessUnit: 'Bandeira Paraná (Super Sul)',
      erpSystem: 'SAP S/4HANA',
      erpCode: undefined,
      status: 'Não solicitado',
      isBlocked: false,
      updatedAt: new Date().toISOString(),
    },
    {
      businessUnit: 'Bandeira Avenida',
      erpSystem: 'Protheus 12',
      erpCode: undefined,
      status: 'Não solicitado',
      isBlocked: false,
      updatedAt: new Date().toISOString(),
    },
    {
      businessUnit: 'Bandeira Boa Supermercados',
      erpSystem: 'Protheus 12',
      erpCode: undefined,
      status: 'Não solicitado',
      isBlocked: false,
      updatedAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="drawer-backdrop" onClick={closeErpDrawer}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 860 }}>
        {/* Header do Drawer */}
        <div className="drawer-header">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                {request?.requestCode}
              </span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {request?.determinedFlow}
              </span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Investida: <strong>{request?.requestingUnit}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Painel de Atendimento Cadastral & Governança ERP
            </h2>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={closeErpDrawer}
            style={{ padding: 6, borderRadius: '50%' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Status e Responsável */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>Status Atual:</span>
              <span className="badge badge-info" style={{ fontWeight: 700 }}>{status}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>Analista:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{assignedAnalyst || 'Não atribuído'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <Clock size={13} />
              <span>Prazo SLA: <strong>{request ? formatDate(request.deadline) : '-'}</strong></span>
            </div>
          </div>
        </div>

        {/* Abas do Painel */}
        <div className="tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'triagem' ? 'active' : ''}`}
            onClick={() => setActiveTab('triagem')}
          >
            <Zap size={14} /> Triagem & Ações
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'dados' ? 'active' : ''}`}
            onClick={() => setActiveTab('dados')}
          >
            <Building size={14} /> Dados Mestres & Fiscais
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'documentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('documentos')}
          >
            <FileCheck2 size={14} /> Dossiê Documental
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'investidas' ? 'active' : ''}`}
            onClick={() => setActiveTab('investidas')}
          >
            <Building2 size={14} /> Situação por Investida
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'historico' ? 'active' : ''}`}
            onClick={() => setActiveTab('historico')}
          >
            <Clock size={14} /> Linha do Tempo
          </button>
        </div>

        {/* Corpo com Informações e Formulário de Ação */}
        <div className="drawer-body">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Carregando dados da solicitação...
            </div>
          ) : !request ? (
            <div style={{ padding: 40, textAlign: 'center' }}>Solicitação não localizada.</div>
          ) : (
            <>
              {/* ABA 1: TRIAGEM & AÇÕES */}
              {activeTab === 'triagem' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Contexto da Solicitação de Sourcing */}
                  <div className="card" style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 12 }}>
                      Contexto da Solicitação & Origem de Sourcing
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                      <div><strong>Fornecedor:</strong> {request.supplierName}</div>
                      <div><strong>CNPJ:</strong> {request.supplierCnpj}</div>
                      <div><strong>Investida Destino:</strong> {request.requestingUnit}</div>
                      <div><strong>Categoria:</strong> {request.category}</div>
                      <div><strong>Comprador Responsável:</strong> {request.requestedBy}</div>
                      <div><strong>Valor da Contratação:</strong> {request.contractValue ? formatCurrency(request.contractValue) : 'Não informado'}</div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <strong>Motivo do Encaminhamento:</strong> {request.notes || 'Fornecedor premiado em sourcing para a investida.'}
                      </div>
                    </div>
                  </div>

                  {/* Ações Rápidas de Transição de Estado */}
                  <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 12 }}>
                      Esteira Operacional de Transição
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickStatusTransition('Em triagem', 'Validar certidões fiscais e domicílio bancário')}
                        disabled={submitting}
                      >
                        <Clock size={13} /> 1. Iniciar Triagem
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#D97706', borderColor: '#FCD34D' }}
                        onClick={() => handleQuickStatusTransition('Aguardando ajuste', 'Aguardando envio de comprovante bancário atualizado', 'Pendência apontada: divergência nos dados bancários informados.')}
                        disabled={submitting}
                      >
                        <AlertTriangle size={13} /> 2. Apontar Pendência (Ajuste)
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                        onClick={() => handleQuickStatusTransition('Pronto para integração', 'Disparar conector API Protheus/SAP')}
                        disabled={submitting}
                      >
                        <CheckCircle2 size={13} /> 3. Marcar Dados como Validados
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleQuickStatusTransition('Em cadastro', 'Aguardando retorno do conector ERP')}
                        disabled={submitting}
                      >
                        <Zap size={13} /> 4. Enviar Integração ERP
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--status-danger)', borderColor: '#FECACA' }}
                        onClick={() => handleQuickStatusTransition('Falha na integração', 'Verificar layout de campos obrigatórios no Protheus', 'Erro retornado pela API: campo Inscrição Estadual inválido para o estado.')}
                        disabled={submitting}
                      >
                        <AlertCircle size={13} /> Registrar Falha de Integração
                      </button>
                    </div>
                  </div>

                  {/* Formulário Operacional */}
                  <div className="card" style={{ border: '2px solid var(--color-primary-light)' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 16 }}>
                      Deliberação & Atribuição de Dados Mestres
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                      {/* Status */}
                      <div className="form-group">
                        <label className="form-label">Status da Solicitação</label>
                        <select
                          className="input-control"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                        >
                          <option value="Recebido">Recebido</option>
                          <option value="Em triagem">Em triagem</option>
                          <option value="Aguardando ajuste">Aguardando ajuste (Pendência)</option>
                          <option value="Pronto para integração">Pronto para integração</option>
                          <option value="Em cadastro">Em cadastro ERP</option>
                          <option value="Falha na integração">Falha na integração</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>

                      {/* Analista */}
                      <div className="form-group">
                        <label className="form-label">Analista Responsável</label>
                        <input
                          type="text"
                          className="input-control"
                          value={assignedAnalyst}
                          onChange={(e) => setAssignedAnalyst(e.target.value)}
                        />
                      </div>

                      {/* Código ERP */}
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">
                          Código do Fornecedor no ERP (Protheus / SAP)
                          {status === 'Concluído' && <span className="required">*</span>}
                        </label>
                        <input
                          type="text"
                          className="input-control"
                          placeholder="Ex: FORN-2025-0102 ou 098442"
                          value={erpSupplierCode}
                          onChange={(e) => setErpSupplierCode(e.target.value)}
                          style={{ fontWeight: 700 }}
                        />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Identificador gerado no sistema de gestão financeira que autoriza compras e pagamentos na investida {request.requestingUnit}.
                        </span>
                      </div>

                      {/* Próxima Ação */}
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Próxima Ação Recomendada</label>
                        <input
                          type="text"
                          className="input-control"
                          placeholder="Ex: Aguardar retorno de certidão ou finalizar amarração contábil..."
                          value={nextStep}
                          onChange={(e) => setNextStep(e.target.value)}
                        />
                      </div>

                      {/* Observações / Pendências */}
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Observações Internas / Motivo de Pendência</label>
                        <textarea
                          className="input-control"
                          placeholder="Descreva detalhes da triagem, inconsistências encontradas ou justificativas..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: DADOS MESTRES & FISCAIS */}
              {activeTab === 'dados' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {supplier ? (
                    <>
                      <div className="card">
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 12 }}>
                          Identificação Cadastral e Parâmetros Fiscais
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: 13 }}>
                          <div><strong>Razão Social:</strong> {supplier.corporateName}</div>
                          <div><strong>Nome Fantasia:</strong> {supplier.tradeName}</div>
                          <div><strong>CNPJ:</strong> {supplier.cnpj}</div>
                          <div><strong>Natureza Jurídica:</strong> {supplier.legalNature || 'Sociedade Empresária Limitada'}</div>
                          <div><strong>Regime Tributário:</strong> {supplier.taxRegime || 'Lucro Presumido'}</div>
                          <div><strong>IBS / CBS:</strong> {supplier.ibsCbsRegime || 'Não Cumulativo Pleno'}</div>
                          <div><strong>Inscrição Estadual:</strong> {supplier.stateRegistration || 'Isento'}</div>
                          <div><strong>Inscrição Municipal:</strong> {supplier.municipalRegistration || '-'}</div>
                          <div><strong>CNAE Principal:</strong> {supplier.mainCnae || '62.01-5-01'}</div>
                          <div><strong>Data de Abertura:</strong> {supplier.openingDate || '12/04/2016'}</div>
                        </div>
                      </div>

                      {/* Domicílio Bancário */}
                      <div className="card">
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 12 }}>
                          Dados Bancários para Integração Financeira
                        </h4>
                        {supplier.bankAccounts && supplier.bankAccounts.length > 0 ? (
                          supplier.bankAccounts.map((b, idx) => (
                            <div key={idx} style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: 6, border: '1px solid var(--border-subtle)', fontSize: 13 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                                <div><strong>Banco:</strong> {b.bankName}</div>
                                <div><strong>Agência:</strong> {b.agency}</div>
                                <div><strong>Conta:</strong> {b.accountNumber}-{b.accountDigit} ({b.accountType})</div>
                                <div><strong>Titular:</strong> {b.accountHolder}</div>
                                <div><strong>CPF/CNPJ:</strong> {b.holderTaxId}</div>
                                <div><strong>Chave PIX:</strong> {b.pixKey || 'Não cadastrada'}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma conta bancária cadastrada.</div>
                        )}
                      </div>

                      {/* Endereço */}
                      <div className="card">
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 12 }}>
                          Endereço Fiscal
                        </h4>
                        {supplier.address ? (
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {supplier.address.street}, nº {supplier.address.number}{' '}
                            {supplier.address.complement && `(${supplier.address.complement})`} - {supplier.address.neighborhood},{' '}
                            {supplier.address.city}/{supplier.address.state} • CEP: {supplier.address.zipCode}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Endereço não informado.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Dados do fornecedor não vinculados.
                    </div>
                  )}
                </div>
              )}

              {/* ABA 3: DOSSIÊ DE DOCUMENTOS */}
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
                      {supplier?.documents && supplier.documents.length > 0 ? (
                        supplier.documents.map((doc) => (
                          <tr key={doc.id}>
                            <td>
                              <div style={{ fontWeight: 700 }}>{doc.documentName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.documentTypeCode}</div>
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

              {/* ABA 4: SITUAÇÃO POR INVESTIDA */}
              {activeTab === 'investidas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', padding: '10px 16px', borderRadius: 8, fontSize: 12, color: '#0369A1' }}>
                    <strong>Cadastros Independentes por Empresa:</strong> Cada investida do Grupo Plurix mantém seu registro independente no respectivo ERP.
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Investida / Unidade</th>
                          <th>ERP</th>
                          <th>Cód. Fornecedor</th>
                          <th>Situação Cadastral</th>
                          <th>Bloqueio</th>
                          <th>Última Atualização</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investidasList.map((inv, idx) => (
                          <tr key={idx}>
                            <td><strong>{inv.businessUnit}</strong></td>
                            <td>{inv.erpSystem}</td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: inv.erpCode ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                                {inv.erpCode || 'Pendente'}
                              </span>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  backgroundColor: inv.status === 'Concluído' ? 'var(--status-success-bg)' : '#F1F5F9',
                                  color: inv.status === 'Concluído' ? 'var(--status-success-text)' : 'var(--text-secondary)',
                                }}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, color: inv.isBlocked ? 'var(--status-danger)' : 'var(--status-success)' }}>
                                {inv.isBlocked ? 'Bloqueado' : 'Regular'}
                              </span>
                            </td>
                            <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {formatDateTime(inv.updatedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 5: LINHA DO TEMPO */}
              {activeTab === 'historico' && (
                <div className="timeline">
                  {history.length > 0 ? (
                    history.map((event) => (
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
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
                      Nenhum registro histórico localizado.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="drawer-footer">
          <button type="button" className="btn btn-secondary" onClick={closeErpDrawer} disabled={submitting}>
            Fechar
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSaveChanges}
            disabled={submitting}
          >
            Salvar Andamento
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConcludeErpRegistration}
            disabled={submitting}
          >
            <CheckCircle2 size={16} />
            {submitting ? 'Processando...' : 'Concluir Cadastro no ERP'}
          </button>
        </div>
      </div>
    </div>
  );
};

