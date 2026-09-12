// ==============================================================================
// MODAL DE REGISTRO DE FORNECEDOR PREMIADO & MATRIZ DE DECISÃO PLURIX
// Implementação exata dos Caminhos A, B, C e D em tempo real
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, DecisionPath } from '../../types';
import { evaluateDecisionMatrix } from '../../services/decisionMatrix';
import { formatCurrency } from '../../utils/formatters';
import {
  X,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileSignature,
  Database,
  Building,
  DollarSign,
} from 'lucide-react';

export const AwardSupplierModal: React.FC = () => {
  const {
    isAwardModalOpen,
    closeAwardModal,
    awardPreselectedSupplierId,
    showToast,
    triggerRefresh,
    setActiveNav,
  } = useApp();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [sourcingCode, setSourcingCode] = useState<string>('');
  const [businessUnit, setBusinessUnit] = useState<string>('Unidade Corporativa SP');
  const [category, setCategory] = useState<string>('Tecnologia');
  const [contractValue, setContractValue] = useState<number>(35000);
  const [buyerName, setBuyerName] = useState<string>('Mariana Esteves');
  const [hasErpRegistration, setHasErpRegistration] = useState<boolean>(false);
  const [erpCode, setErpCode] = useState<string>('');
  const [needsContract, setNeedsContract] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isAwardModalOpen) {
      // Carrega fornecedores para o seletor
      fetch('/api/suppliers')
        .then((r) => r.json())
        .then((data: Supplier[]) => {
          setSuppliers(data);
          const initialId = awardPreselectedSupplierId || data[0]?.id || '';
          setSelectedSupplierId(initialId);

          // Ajusta parâmetros iniciais com base no fornecedor
          const found = data.find((s) => s.id === initialId);
          if (found) {
            setCategory(found.mainCategory || 'Tecnologia');
            setHasErpRegistration(found.erpStatus === 'Concluído' || found.erpStatus === 'Já cadastrado');
            setErpCode(found.erpCode || '');
          }
        });

      // Gera código de processo sequencial sugerido
      const randNum = Math.floor(Math.random() * 800) + 100;
      setSourcingCode(`RFP-2025-${randNum}`);
    }
  }, [isAwardModalOpen, awardPreselectedSupplierId]);

  // Ao mudar fornecedor no select
  const handleSupplierChange = (id: string) => {
    setSelectedSupplierId(id);
    const found = suppliers.find((s) => s.id === id);
    if (found) {
      setCategory(found.mainCategory || 'Tecnologia');
      const isErp = found.erpStatus === 'Concluído' || found.erpStatus === 'Já cadastrado';
      setHasErpRegistration(isErp);
      setErpCode(found.erpCode || '');
    }
  };

  // Avaliação em tempo real da Matriz de Decisão
  const decisionEvaluation = useMemo(() => {
    return evaluateDecisionMatrix({
      supplierId: selectedSupplierId,
      hasErpRegistration,
      contractValue,
      needsContract,
    });
  }, [selectedSupplierId, hasErpRegistration, contractValue, needsContract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showToast('Selecione um fornecedor para registrar a premiação.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplierId: selectedSupplierId,
        sourcingProcessCode: sourcingCode,
        businessUnit,
        category,
        contractValue,
        buyerName,
        hasErpRegistration,
        erpCode: hasErpRegistration ? erpCode : undefined,
        needsContract,
        notes,
      };

      const res = await fetch('/api/awards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Falha ao registrar premiação');

      showToast(
        `Fornecedor premiado com sucesso! Matriz direcionou para o ${decisionEvaluation.pathCode} (${decisionEvaluation.pathName}).`,
        'success'
      );
      closeAwardModal();
      triggerRefresh();
      setActiveNav('procurement-awards');
    } catch {
      showToast('Erro ao salvar premiação na Matriz de Decisão.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAwardModalOpen) return null;

  return (
    <div className="modal-backdrop" onClick={closeAwardModal}>
      <div className="modal-dialog" style={{ maxWidth: 780 }} onClick={(e) => e.stopPropagation()}>
        {/* Topo do Modal */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF' }}>
                Registrar Fornecedor Premiado em Sourcing
              </h2>
              <span style={{ fontSize: 12, color: 'var(--color-accent)' }}>
                Matriz de Decisão Corporativa Plurix (Caminhos A, B, C ou D)
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={closeAwardModal}
            style={{ color: '#FFFFFF', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* Fornecedor */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">
                Fornecedor Vencedor <span className="required">*</span>
              </label>
              <select
                className="input-control"
                value={selectedSupplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.tradeName || s.corporateName} — CNPJ: {s.cnpj} ({s.status} / ERP: {s.erpStatus})
                  </option>
                ))}
              </select>
            </div>

            {/* Código do Processo */}
            <div className="form-group">
              <label className="form-label">Processo de Sourcing / RFP <span className="required">*</span></label>
              <input
                type="text"
                className="input-control"
                value={sourcingCode}
                onChange={(e) => setSourcingCode(e.target.value)}
                required
              />
            </div>

            {/* Comprador */}
            <div className="form-group">
              <label className="form-label">Comprador Responsável <span className="required">*</span></label>
              <input
                type="text"
                className="input-control"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
              />
            </div>

            {/* Unidade Plurix */}
            <div className="form-group">
              <label className="form-label">Unidade Demandante</label>
              <select
                className="input-control"
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
              >
                <option value="CD Central Arujá">CD Central Arujá</option>
                <option value="CD Regional Ribeirão">CD Regional Ribeirão</option>
                <option value="Unidade Corporativa SP">Unidade Corporativa SP</option>
                <option value="Bandeira Super Sul">Bandeira Super Sul</option>
                <option value="Bandeira Mais Você">Bandeira Mais Você</option>
                <option value="Hiper Plurix Campinas">Hiper Plurix Campinas</option>
              </select>
            </div>

            {/* Categoria */}
            <div className="form-group">
              <label className="form-label">Categoria do Fornecimento</label>
              <select
                className="input-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Tecnologia">Tecnologia</option>
                <option value="Facilities">Facilities</option>
                <option value="Logística">Logística</option>
                <option value="Marketing">Marketing</option>
                <option value="Jurídico">Jurídico</option>
                <option value="Serviços profissionais">Serviços profissionais</option>
                <option value="Produtos operacionais">Produtos operacionais</option>
                <option value="Obras e manutenção">Obras e manutenção</option>
              </select>
            </div>

            {/* Valor do Contrato / Compra */}
            <div className="form-group">
              <label className="form-label">
                Valor Total Estimado da Contratação <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: 10,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  R$
                </span>
                <input
                  type="number"
                  step="500"
                  className="input-control"
                  style={{ paddingLeft: 38, fontWeight: 700, fontSize: 15 }}
                  value={contractValue}
                  onChange={(e) => setContractValue(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {contractValue <= 50000 ? 'Limite até R$ 50.000 (Rito Simplificado)' : 'Acima de R$ 50.000 (Rito Pleno)'}
              </span>
            </div>
          </div>

          {/* Perguntas-Chave da Matriz de Decisão */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: '18px 20px',
              marginBottom: 20,
            }}
          >
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 14 }}>
              Diretrizes de Enquadramento Operacional
            </h4>

            {/* Pergunta 1: Cadastro Ativo no ERP */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                1. O fornecedor já possui cadastro ativo no ERP (Protheus / SAP)?
              </label>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="erpRegistration"
                    checked={hasErpRegistration}
                    onChange={() => setHasErpRegistration(true)}
                  />
                  <span>Sim, já possui código ativo no ERP</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="erpRegistration"
                    checked={!hasErpRegistration}
                    onChange={() => {
                      setHasErpRegistration(false);
                      setErpCode('');
                    }}
                  />
                  <span>Não, não possui cadastro no ERP (Necessita criação)</span>
                </label>
              </div>

              {hasErpRegistration && (
                <div style={{ marginTop: 10, maxWidth: 300 }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Código ERP (Ex: FORN-00389)"
                    value={erpCode}
                    onChange={(e) => setErpCode(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Pergunta 2: Exige Contrato Jurídico Prévio */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                2. A contratação exige formalização de contrato jurídico prévio / aditivo?
              </label>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="needsContract"
                    checked={needsContract}
                    onChange={() => setNeedsContract(true)}
                  />
                  <span>Sim (Exige minuta, background check ou aditivo contratual)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="needsContract"
                    checked={!needsContract}
                    onChange={() => setNeedsContract(false)}
                  />
                  <span>Não (Contratação direta via Ordem de Compra / Termo simplificado)</span>
                </label>
              </div>
            </div>
          </div>

          {/* PAINEL DE FEEDBACK EM TEMPO REAL DA MATRIZ DE DECISÃO */}
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '2px solid var(--color-accent)',
              borderRadius: 12,
              padding: '18px 20px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  CAMINHO {decisionEvaluation.pathCode}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
                  {decisionEvaluation.pathName}
                </span>
              </div>

              <span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>
                Regra Corporativa Aplicada
              </span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
              {decisionEvaluation.rationale}
            </p>

            {/* Trilha do Fluxo Determinado */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Trilha Determinada para Execução:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {decisionEvaluation.suggestedSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{step.stepName}</span>
                    <span style={{ color: 'var(--text-muted)' }}>— {step.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Observações Complementares para o Processo</label>
            <textarea
              className="input-control"
              placeholder="Instruções de faturamento, prazos de entrega ou particularidades da RFP..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Botões do Rodapé */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeAwardModal}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: 200 }}
            >
              <Award size={16} />
              {submitting ? 'Gravando...' : 'Confirmar e Iniciar Fluxo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
