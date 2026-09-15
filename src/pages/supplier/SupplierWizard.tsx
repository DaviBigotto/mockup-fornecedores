// ==============================================================================
// WIZARD DE CADASTRO GUIADO (8 ETAPAS) - PLURIX ORGANIZER
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, Shareholder, CommercialReference, BankAccount } from '../../types';
import { formatCnpj, formatCep, formatPhone, formatDate } from '../../utils/formatters';
import {
  Building,
  MapPin,
  Tag,
  Receipt,
  Landmark,
  Users2,
  FileCheck,
  Send,
  Save,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const STEP_LABELS = [
  { step: 1, name: 'Empresa', icon: Building },
  { step: 2, name: 'Contato e Endereço', icon: MapPin },
  { step: 3, name: 'Atuação e Cobertura', icon: Tag },
  { step: 4, name: 'Fiscal e Tributário', icon: Receipt },
  { step: 5, name: 'Dados Bancários', icon: Landmark },
  { step: 6, name: 'Sócios e Referências', icon: Users2 },
  { step: 7, name: 'Documentos', icon: FileCheck },
  { step: 8, name: 'Revisão e Envio', icon: Send },
];

const AVAILABLE_CATEGORIES = [
  'Tecnologia',
  'Facilities',
  'Logística',
  'Marketing',
  'Jurídico',
  'Serviços profissionais',
  'Produtos operacionais',
  'Obras e manutenção',
];

const AVAILABLE_REGIONS = ['Sudeste', 'Sul', 'Centro-Oeste', 'Nordeste', 'Norte'];

const AVAILABLE_UNIDADES = [
  'CD Central Arujá',
  'CD Regional Ribeirão',
  'Unidade Corporativa SP',
  'Bandeira Super Sul',
  'Bandeira Mais Você',
  'Hiper Plurix Campinas',
];

export const SupplierWizard: React.FC = () => {
  const { showToast, triggerRefresh, setActiveNav, activeSupplierId, dataVersion, currentUser } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  // Form State
  const [formData, setFormData] = useState({
    // 1. Empresa
    cnpj: '',
    corporateName: '',
    tradeName: '',
    legalNature: '206-2 - Sociedade Empresária Limitada',
    stateRegistration: '',
    municipalRegistration: '',
    mainCnae: '',
    openingDate: '',
    companySize: 'Médio Porte',
    taxRegime: 'Lucro Presumido',
    simplesNacional: false,
    ibsCbsRegime: 'Não Cumulativo Pleno',
    ibsCbsContributor: true,
    taxClassification: '',

    // 2. Contato e Endereço
    contactName: '',
    contactRole: '',
    contactEmail: '',
    contactPhone: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',

    // 3. Atuação
    mainCategory: 'Tecnologia',
    categories: ['Tecnologia'] as string[],
    subcategories: [] as string[],
    productsServices: '',
    regions: ['Sudeste'] as string[],
    states: ['SP'] as string[],
    businessUnits: ['Unidade Corporativa SP'] as string[],
    serviceCapacity: '',
    marketExperienceYears: 5,
    estimatedEmployees: 25,

    // 4. Fiscal e Tributário
    withholdingRetencao: 'Padrão com retenção de ISS no município do tomador',
    optanteCprb: false,

    // 5. Dados Bancários
    bankName: 'Banco Itaú Unibanco S.A.',
    agency: '',
    accountNumber: '',
    accountDigit: '',
    accountType: 'Corrente' as 'Corrente' | 'Poupança',
    accountHolder: '',
    holderTaxId: '',
    pixKey: '',
    pixKeyType: 'CNPJ' as 'CNPJ' | 'CPF' | 'E-mail' | 'Telefone' | 'Aleatória',

    // 6. Sócios e Referências
    shareholders: [] as Shareholder[],
    commercialReferences: [] as CommercialReference[],
  });

  // Novo Sócio (Modal/Inline)
  const [newShareholder, setNewShareholder] = useState({
    name: '',
    document: '',
    equityPercentage: 0,
    role: 'Sócio',
  });

  // Nova Referência
  const [newReference, setNewReference] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    relationshipDescription: '',
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        let supData: Supplier | null = null;
        if (activeSupplierId) {
          const res = await fetch(`/api/suppliers/${activeSupplierId}`);
          if (res.ok) {
            supData = await res.json();
          }
        }
        if (!supData) {
          const resAll = await fetch('/api/suppliers');
          if (resAll.ok) {
            const list: Supplier[] = await resAll.json();
            if (Array.isArray(list) && list.length > 0) {
              const userEmail = currentUser?.email?.toLowerCase().trim();
              const matched = userEmail
                ? list.find(
                    (s) =>
                      s.createdBy?.toLowerCase().trim() === userEmail ||
                      s.contacts?.some((c) => c.email?.toLowerCase().trim() === userEmail)
                  )
                : null;
              supData = matched || (userEmail === 'fornecedor@demo.com' ? list[0] : (list[0]?.createdBy ? null : list[0]));
            }
          }
        }

        setSupplier(supData);
        if (supData) {
          if (supData.currentStep && supData.currentStep >= 1 && supData.currentStep <= 8) {
            setCurrentStep(supData.currentStep);
          }

          const contact = supData.contacts?.[0];
          const addr = supData.address;
          const bank = supData.bankAccounts?.[0];
          const draft = supData.draftData || {};

          setFormData({
            cnpj: supData.cnpj || '',
            corporateName: supData.corporateName || '',
            tradeName: supData.tradeName || supData.corporateName || '',
            legalNature: supData.legalNature || '206-2 - Sociedade Empresária Limitada',
            stateRegistration: supData.stateRegistration || '',
            municipalRegistration: supData.municipalRegistration || '',
            mainCnae: supData.mainCnae || '',
            openingDate: supData.openingDate || '',
            companySize: supData.companySize || 'Médio Porte',
            taxRegime: supData.taxRegime || 'Lucro Presumido',
            simplesNacional: !!supData.simplesNacional,
            ibsCbsRegime: supData.ibsCbsRegime || 'Não Cumulativo Pleno',
            ibsCbsContributor: supData.ibsCbsContributor !== false,
            taxClassification: supData.taxClassification || '',

            contactName: contact?.name || currentUser?.name || '',
            contactRole: contact?.role || 'Representante Legal',
            contactEmail: contact?.email || currentUser?.email || '',
            contactPhone: contact?.phone || '',

            zipCode: addr?.zipCode || '',
            street: addr?.street || '',
            number: addr?.number || '',
            complement: addr?.complement || '',
            neighborhood: addr?.neighborhood || '',
            city: addr?.city || '',
            state: addr?.state || 'SP',

            mainCategory: supData.mainCategory || 'Tecnologia',
            categories: supData.categories?.length ? supData.categories : ['Tecnologia'],
            subcategories: supData.subcategories || [],
            productsServices: supData.productsServices || '',
            regions: supData.regions?.length ? supData.regions : ['Sudeste'],
            states: supData.states?.length ? supData.states : ['SP'],
            businessUnits: supData.businessUnits?.length ? supData.businessUnits : ['Unidade Corporativa SP'],
            serviceCapacity: supData.serviceCapacity || '',
            marketExperienceYears: supData.marketExperienceYears ?? 5,
            estimatedEmployees: supData.estimatedEmployees ?? 25,

            withholdingRetencao: draft.withholdingRetencao || 'Padrão com retenção de ISS no município do tomador',
            optanteCprb: !!draft.optanteCprb,

            bankName: bank?.bankName || 'Banco Itaú Unibanco S.A.',
            agency: bank?.agency || '',
            accountNumber: bank?.accountNumber || '',
            accountDigit: bank?.accountDigit || '',
            accountType: bank?.accountType || 'Corrente',
            accountHolder: bank?.accountHolder || supData.corporateName || '',
            holderTaxId: bank?.holderTaxId || supData.cnpj || '',
            pixKey: bank?.pixKey || '',
            pixKeyType: bank?.pixKeyType || 'CNPJ',

            shareholders: supData.shareholders || [],
            commercialReferences: supData.commercialReferences || [],
          });
        }
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [activeSupplierId, dataVersion, currentUser]);


  const totalEquity = formData.shareholders.reduce((acc, s) => acc + (Number(s.equityPercentage) || 0), 0);

  const handleAddShareholder = () => {
    if (!newShareholder.name || !newShareholder.document || !newShareholder.equityPercentage) {
      showToast('Preencha os dados do sócio antes de adicionar.', 'error');
      return;
    }

    if (totalEquity + Number(newShareholder.equityPercentage) > 100) {
      showToast('A soma da participação societária não pode ultrapassar 100%.', 'error');
      return;
    }

    const item: Shareholder = {
      id: `sh-${Date.now()}`,
      name: newShareholder.name,
      document: newShareholder.document,
      equityPercentage: Number(newShareholder.equityPercentage),
      role: newShareholder.role,
    };

    setFormData((prev) => ({
      ...prev,
      shareholders: [...prev.shareholders, item],
    }));

    setNewShareholder({ name: '', document: '', equityPercentage: 0, role: 'Sócio' });
    showToast('Sócio adicionado com sucesso.', 'success');
  };

  const handleRemoveShareholder = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      shareholders: prev.shareholders.filter((s) => s.id !== id),
    }));
  };

  const handleAddReference = () => {
    if (!newReference.companyName || !newReference.contactName || !newReference.email) {
      showToast('Preencha os campos obrigatórios da referência.', 'error');
      return;
    }

    const item: CommercialReference = {
      id: `cr-${Date.now()}`,
      ...newReference,
    };

    setFormData((prev) => ({
      ...prev,
      commercialReferences: [...prev.commercialReferences, item],
    }));

    setNewReference({ companyName: '', contactName: '', email: '', phone: '', relationshipDescription: '' });
    showToast('Referência comercial incluída.', 'success');
  };

  const handleRemoveReference = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      commercialReferences: prev.commercialReferences.filter((r) => r.id !== id),
    }));
  };

  const toggleCategory = (cat: string) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(cat);
      const next = exists ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat];
      return {
        ...prev,
        categories: next.length > 0 ? next : [cat],
        mainCategory: next[0] || cat,
      };
    });
  };

  const toggleRegion = (reg: string) => {
    setFormData((prev) => {
      const exists = prev.regions.includes(reg);
      const next = exists ? prev.regions.filter((r) => r !== reg) : [...prev.regions, reg];
      return { ...prev, regions: next.length > 0 ? next : [reg] };
    });
  };

  const toggleBusinessUnit = (unit: string) => {
    setFormData((prev) => {
      const exists = prev.businessUnits.includes(unit);
      const next = exists ? prev.businessUnits.filter((u) => u !== unit) : [...prev.businessUnits, unit];
      return { ...prev, businessUnits: next.length > 0 ? next : [unit] };
    });
  };

  const buildSupplierPayload = (
    stepNum: number,
    statusOverride?: Supplier['status'],
    completionOverride?: number
  ): Partial<Supplier> => {
    const calcPercentage =
      completionOverride !== undefined
        ? completionOverride
        : Math.min(100, Math.max(supplier?.completionPercentage || 15, Math.round((stepNum / 8) * 100)));

    let finalStatus = statusOverride;
    if (!finalStatus) {
      if (supplier?.status === 'Pré-cadastro' && stepNum > 1) {
        finalStatus = 'Em preenchimento';
      } else {
        finalStatus = supplier?.status || 'Em preenchimento';
      }
    }

    return {
      cnpj: formData.cnpj,
      corporateName: formData.corporateName,
      tradeName: formData.tradeName || formData.corporateName,
      legalNature: formData.legalNature,
      stateRegistration: formData.stateRegistration,
      municipalRegistration: formData.municipalRegistration,
      mainCnae: formData.mainCnae,
      openingDate: formData.openingDate,
      companySize: formData.companySize,
      taxRegime: formData.taxRegime,
      simplesNacional: formData.simplesNacional,
      ibsCbsRegime: formData.ibsCbsRegime,
      ibsCbsContributor: formData.ibsCbsContributor,
      taxClassification: formData.taxClassification,
      mainCategory: formData.mainCategory,
      categories: formData.categories,
      subcategories: formData.subcategories,
      productsServices: formData.productsServices,
      regions: formData.regions,
      states: formData.states,
      businessUnits: formData.businessUnits,
      serviceCapacity: formData.serviceCapacity,
      marketExperienceYears: Number(formData.marketExperienceYears) || 0,
      estimatedEmployees: Number(formData.estimatedEmployees) || 0,
      currentStep: stepNum,
      completionPercentage: calcPercentage,
      status: finalStatus,
      contacts: [
        {
          id: supplier?.contacts?.[0]?.id || `c-${Date.now()}`,
          name: formData.contactName || currentUser?.name || 'Representante Legal',
          role: formData.contactRole || 'Representante Legal',
          email: formData.contactEmail || currentUser?.email || '',
          phone: formData.contactPhone || '',
          isPrimary: true,
        },
      ],
      address: {
        zipCode: formData.zipCode,
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
      },
      bankAccounts: [
        {
          bankName: formData.bankName,
          agency: formData.agency,
          accountNumber: formData.accountNumber,
          accountDigit: formData.accountDigit,
          accountType: formData.accountType,
          accountHolder: formData.accountHolder || formData.corporateName,
          holderTaxId: formData.holderTaxId || formData.cnpj,
          pixKey: formData.pixKey,
          pixKeyType: formData.pixKeyType,
        },
      ],
      shareholders: formData.shareholders,
      commercialReferences: formData.commercialReferences,
      draftData: {
        withholdingRetencao: formData.withholdingRetencao,
        optanteCprb: formData.optanteCprb,
      },
    };
  };

  const saveToServer = async (payload: Partial<Supplier>, showToastMessage = false) => {
    if (!supplier?.id) return;
    setSaving(true);
    try {
      const userName = currentUser?.name || 'Fornecedor';
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-name': userName },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setSupplier(updated);
        if (showToastMessage) {
          showToast('Progresso salvo com sucesso! Você pode continuar a qualquer momento.', 'success');
        }
        triggerRefresh();
      }
    } catch {
      if (showToastMessage) {
        showToast('Erro ao salvar dados cadastrais.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const payload = buildSupplierPayload(currentStep, supplier?.status === 'Pré-cadastro' ? 'Em preenchimento' : undefined);
    await saveToServer(payload, true);
  };

  const handleStepTransition = async (targetStep: number) => {
    const boundedStep = Math.max(1, Math.min(8, targetStep));
    setCurrentStep(boundedStep);
    const payload = buildSupplierPayload(boundedStep);
    await saveToServer(payload, false);
  };

  const handleFinalSubmit = async () => {
    if (!supplier?.id) {
      showToast('Nenhum fornecedor selecionado para envio.', 'error');
      return;
    }

    setSaving(true);
    try {
      const userName = currentUser?.name || 'Fornecedor';
      const payload = buildSupplierPayload(8, 'Enviado', 100);
      payload.documentStatus = (supplier.documents && supplier.documents.length > 0) ? 'Em validação' : 'Enviado';

      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-name': userName },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      showToast('Cadastro submetido com sucesso para análise e homologação!', 'success');
      triggerRefresh();
      setActiveNav('supplier-dashboard');
    } catch {
      showToast('Erro ao submeter cadastro.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Carregando dados cadastrais...</div>;
  }

  if (!supplier) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhum pré-cadastro ativo encontrado</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Para preencher o formulário guiado de homologação, inicie o seu pré-cadastro com os dados iniciais da sua empresa.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setActiveNav('supplier-prereg')}>
          Iniciar Pré-Cadastro Agora
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Barra de Progresso Superior e Navegação das 8 Etapas */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>
              Formulário Guiado de Cadastramento e Homologação
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Etapa {currentStep} de 8: {STEP_LABELS[currentStep - 1]?.name}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveDraft}
              disabled={saving}
              title="Salvar progresso para continuar posteriormente"
            >
              <Save size={15} />
              {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </button>
          </div>
        </div>

        {/* Stepper Horizontal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflowX: 'auto',
            paddingBottom: 8,
          }}
        >
          {STEP_LABELS.map((item, idx) => {
            const isCompleted = item.step < currentStep;
            const isCurrent = item.step === currentStep;

            return (
              <button
                key={item.step}
                type="button"
                onClick={() => handleStepTransition(item.step)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: 80,
                  opacity: isCompleted || isCurrent ? 1 : 0.5,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: isCompleted
                      ? 'var(--status-success)'
                      : isCurrent
                      ? 'var(--color-primary)'
                      : '#E2E8F0',
                    color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: isCurrent ? '0 0 0 3px var(--color-primary-light)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : item.step}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--color-primary)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Etapa Atual */}
      <div className="card" style={{ padding: '28px 32px' }}>
        {/* ETAPA 1: EMPRESA */}
        {currentStep === 1 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Etapa 1: Dados Empresariais e Identificação Fiscal
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  CNPJ <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Razão Social <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.corporateName}
                  onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nome Fantasia</label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Natureza Jurídica</label>
                <select
                  className="input-control"
                  value={formData.legalNature}
                  onChange={(e) => setFormData({ ...formData, legalNature: e.target.value })}
                >
                  <option value="206-2 - Sociedade Empresária Limitada">206-2 - Sociedade Empresária Limitada</option>
                  <option value="205-4 - Sociedade Anônima Fechada">205-4 - Sociedade Anônima Fechada</option>
                  <option value="204-6 - Sociedade Anônima Aberta">204-6 - Sociedade Anônima Aberta</option>
                  <option value="213-5 - Empresário Individual">213-5 - Empresário Individual</option>
                  <option value="214-3 - Sociedade Simples Pura">214-3 - Sociedade Simples Pura</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Inscrição Estadual</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Isento ou número"
                  value={formData.stateRegistration}
                  onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Inscrição Municipal</label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.municipalRegistration}
                  onChange={(e) => setFormData({ ...formData, municipalRegistration: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">CNAE Principal</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="00.00-0-00"
                  value={formData.mainCnae}
                  onChange={(e) => setFormData({ ...formData, mainCnae: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Abertura</label>
                <input
                  type="date"
                  className="input-control"
                  value={formData.openingDate}
                  onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Porte da Empresa</label>
                <select
                  className="input-control"
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                >
                  <option value="MEI">MEI - Microempreendedor</option>
                  <option value="ME">ME - Microempresa</option>
                  <option value="EPP">EPP - Empresa de Pequeno Porte</option>
                  <option value="Médio Porte">Médio Porte</option>
                  <option value="Grande Porte">Grande Porte</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Regime Tributário</label>
                <select
                  className="input-control"
                  value={formData.taxRegime}
                  onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                >
                  <option value="Simples Nacional">Simples Nacional</option>
                  <option value="Lucro Presumido">Lucro Presumido</option>
                  <option value="Lucro Real">Lucro Real</option>
                </select>
              </div>
            </div>

            {/* Reforma Tributária IBS/CBS */}
            <div
              style={{
                backgroundColor: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: 8,
                padding: 16,
                marginTop: 16,
              }}
            >
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10 }}>
                Enquadramento Reforma Tributária (IBS / CBS)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Regime de Apuração IBS/CBS</label>
                  <select
                    className="input-control"
                    value={formData.ibsCbsRegime}
                    onChange={(e) => setFormData({ ...formData, ibsCbsRegime: e.target.value })}
                  >
                    <option value="Não Cumulativo Pleno">Não Cumulativo Pleno</option>
                    <option value="Cumulativo">Cumulativo</option>
                    <option value="Diferenciado / Específico">Diferenciado / Específico</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0, justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 22 }}>
                    <input
                      type="checkbox"
                      checked={formData.ibsCbsContributor}
                      onChange={(e) => setFormData({ ...formData, ibsCbsContributor: e.target.checked })}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Contribuinte Ativo do IBS/CBS</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 2: CONTATO E ENDEREÇO */}
        {currentStep === 2 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Etapa 2: Contatos Principais e Endereço da Sede
            </h3>

            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12 }}>
              Contato Principal
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Nome do Contato <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cargo</label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.contactRole}
                  onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail Comercial <span className="required">*</span></label>
                <input
                  type="email"
                  className="input-control"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone / WhatsApp <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: formatPhone(e.target.value) })}
                />
              </div>
            </div>

            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              Endereço Fiscal
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">CEP <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="00000-000"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: formatCep(e.target.value) })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Logradouro <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Complemento</label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bairro <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Município <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado (UF) <span className="required">*</span></label>
                <select
                  className="input-control"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  <option value="SP">São Paulo (SP)</option>
                  <option value="MG">Minas Gerais (MG)</option>
                  <option value="RJ">Rio de Janeiro (RJ)</option>
                  <option value="PR">Paraná (PR)</option>
                  <option value="SC">Santa Catarina (SC)</option>
                  <option value="RS">Rio Grande do Sul (RS)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 3: ATUAÇÃO E COBERTURA (CHIPS) */}
        {currentStep === 3 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Etapa 3: Áreas de Atuação e Cobertura Geográfica
            </h3>

            {/* Categorias */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">
                Categorias de Fornecimento Atendidas (Selecione com as tags) <span className="required">*</span>
              </label>
              <div className="chips-container">
                {AVAILABLE_CATEGORIES.map((cat) => {
                  const isSelected = formData.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Regiões Atendidas */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Regiões Atendidas</label>
              <div className="chips-container">
                {AVAILABLE_REGIONS.map((reg) => {
                  const isSelected = formData.regions.includes(reg);
                  return (
                    <button
                      key={reg}
                      type="button"
                      className={`chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleRegion(reg)}
                    >
                      {reg}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unidades Plurix */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Unidades / Bandeiras Plurix com Capacidade de Atendimento</label>
              <div className="chips-container">
                {AVAILABLE_UNIDADES.map((u) => {
                  const isSelected = formData.businessUnits.includes(u);
                  return (
                    <button
                      key={u}
                      type="button"
                      className={`chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleBusinessUnit(u)}
                    >
                      {u}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tempo de Mercado (anos)</label>
                <input
                  type="number"
                  className="input-control"
                  value={formData.marketExperienceYears}
                  onChange={(e) => setFormData({ ...formData, marketExperienceYears: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quantidade Estimada de Colaboradores</label>
                <input
                  type="number"
                  className="input-control"
                  value={formData.estimatedEmployees}
                  onChange={(e) => setFormData({ ...formData, estimatedEmployees: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Capacidade de Atendimento e Detalhes Operacionais</label>
              <textarea
                className="input-control"
                placeholder="Descreva a frota, SLA de atendimento, estrutura técnica ou capacidade produtiva..."
                value={formData.serviceCapacity}
                onChange={(e) => setFormData({ ...formData, serviceCapacity: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* ETAPA 4: FISCAL E TRIBUTÁRIO */}
        {currentStep === 4 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Etapa 4: Parâmetros Fiscais e Retenções
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Classificação Tributária / Operação</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ex: Prestação de Serviços de TI - Lei Complementar 116/03"
                  value={formData.taxClassification}
                  onChange={(e) => setFormData({ ...formData, taxClassification: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tratamento de Retenções na Fonte</label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.withholdingRetencao}
                  onChange={(e) => setFormData({ ...formData, withholdingRetencao: e.target.value })}
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: 16,
                marginTop: 16,
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.simplesNacional}
                  onChange={(e) => setFormData({ ...formData, simplesNacional: e.target.checked })}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Empresa optante regular pelo Simples Nacional (Sem retenção de IRRF/CSLL/PIS/COFINS na fonte)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ETAPA 5: DADOS BANCÁRIOS */}
        {currentStep === 5 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Etapa 5: Domicílio Bancário para Pagamento
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Instituição Financeira <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ex: Banco Bradesco S.A."
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Agência (sem dígito) <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="0000"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número da Conta <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="00000"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dígito da Conta <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="0"
                  value={formData.accountDigit}
                  onChange={(e) => setFormData({ ...formData, accountDigit: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Conta</label>
                <select
                  className="input-control"
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                >
                  <option value="Corrente">Conta Corrente</option>
                  <option value="Poupança">Conta Poupança</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Titular da Conta <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-control"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 8 }}>
              <div className="form-group">
                <label className="form-label">Tipo de Chave PIX</label>
                <select
                  className="input-control"
                  value={formData.pixKeyType}
                  onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value as any })}
                >
                  <option value="CNPJ">CNPJ</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Telefone">Telefone</option>
                  <option value="Aleatória">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Chave PIX</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Informe a chave cadastrada no banco"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 6: SÓCIOS E REFERÊNCIAS */}
        {currentStep === 6 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Etapa 6: Estrutura Societária e Referências Comerciais
            </h3>

            {/* Quadro Societário */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
                  Quadro de Sócios e Administradores (QSA)
                </h4>
                <div style={{ fontSize: 13, fontWeight: 600, color: totalEquity > 100 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                  Total Participação: {totalEquity}% / 100%
                </div>
              </div>

              {formData.shareholders.length > 0 && (
                <div className="table-container" style={{ marginBottom: 16 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nome do Sócio</th>
                        <th>CPF / Documento</th>
                        <th>Participação</th>
                        <th>Função</th>
                        <th style={{ textAlign: 'right' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.shareholders.map((s) => (
                        <tr key={s.id}>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.document}</td>
                          <td>{s.equityPercentage}%</td>
                          <td>{s.role}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleRemoveShareholder(s.id)}
                              style={{ color: 'var(--status-danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Adicionar Sócio */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  alignItems: 'flex-end',
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Nome Completo</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Nome do sócio"
                    value={newShareholder.name}
                    onChange={(e) => setNewShareholder({ ...newShareholder, name: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>CPF</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="000.000.000-00"
                    value={newShareholder.document}
                    onChange={(e) => setNewShareholder({ ...newShareholder, document: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>% Participação</label>
                  <input
                    type="number"
                    className="input-control"
                    placeholder="Ex: 50"
                    value={newShareholder.equityPercentage || ''}
                    onChange={(e) => setNewShareholder({ ...newShareholder, equityPercentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Função</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Sócio-Administrador"
                    value={newShareholder.role}
                    onChange={(e) => setNewShareholder({ ...newShareholder, role: e.target.value })}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddShareholder}
                  style={{ height: 40 }}
                >
                  <Plus size={15} /> Adicionar Sócio
                </button>
              </div>
            </div>

            {/* Referências Comerciais */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12 }}>
                Referências Comerciais de Mercado
              </h4>

              {formData.commercialReferences.length > 0 && (
                <div className="table-container" style={{ marginBottom: 16 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Empresa</th>
                        <th>Contato</th>
                        <th>E-mail</th>
                        <th>Telefone</th>
                        <th style={{ textAlign: 'right' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.commercialReferences.map((r) => (
                        <tr key={r.id}>
                          <td><strong>{r.companyName}</strong></td>
                          <td>{r.contactName}</td>
                          <td>{r.email}</td>
                          <td>{r.phone}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleRemoveReference(r.id)}
                              style={{ color: 'var(--status-danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Adicionar Referência */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  alignItems: 'flex-end',
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Empresa Cliente</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Nome da empresa"
                    value={newReference.companyName}
                    onChange={(e) => setNewReference({ ...newReference, companyName: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Pessoa de Contato</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Nome do contato"
                    value={newReference.contactName}
                    onChange={(e) => setNewReference({ ...newReference, contactName: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>E-mail</label>
                  <input
                    type="email"
                    className="input-control"
                    placeholder="contato@cliente.com"
                    value={newReference.email}
                    onChange={(e) => setNewReference({ ...newReference, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Telefone</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="(00) 0000-0000"
                    value={newReference.phone}
                    onChange={(e) => setNewReference({ ...newReference, phone: e.target.value })}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddReference}
                  style={{ height: 40 }}
                >
                  <Plus size={15} /> Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 7: DOCUMENTOS (DIRECIONA PARA GESTÃO COMPLETA) */}
        {currentStep === 7 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              Etapa 7: Upload e Validação do Dossiê Documental
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Anexe as certidões negativas, contrato social e alvarás obrigatórios para análise da equipe de governança.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {supplier?.documents?.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                      {doc.documentName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Arquivo: {doc.fileName || 'Pendente de envio'} | Validade: {formatDate(doc.expirationDate)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge ${doc.status === 'Válido' ? 'badge-success' : 'badge-warning'}`}>
                      {doc.status}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveNav('supplier-documents')}
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveNav('supplier-documents')}
              >
                Abrir Painel Completo de Gestão de Documentos
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 8: REVISÃO E ENVIO */}
        {currentStep === 8 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Etapa 8: Revisão e Envio para Homologação
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
              Revise o resumo das informações antes de submeter seu cadastro. Após o envio, você passará a constar na Vendor List da Plurix.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
                  Identificação da Empresa
                </h4>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div><strong>Razão Social:</strong> {formData.corporateName}</div>
                  <div><strong>Nome Fantasia:</strong> {formData.tradeName}</div>
                  <div><strong>CNPJ:</strong> {formData.cnpj}</div>
                  <div><strong>Regime Tributário:</strong> {formData.taxRegime}</div>
                  <div><strong>IBS/CBS:</strong> {formData.ibsCbsRegime}</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
                  Atuação e Cobertura
                </h4>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div><strong>Categorias:</strong> {formData.categories.join(', ')}</div>
                  <div><strong>Regiões:</strong> {formData.regions.join(', ')}</div>
                  <div><strong>Unidades:</strong> {formData.businessUnits.join(', ')}</div>
                  <div><strong>Sócios Cadastrados:</strong> {formData.shareholders.length} sócios</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
                  Domicílio Bancário
                </h4>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div><strong>Banco:</strong> {formData.bankName}</div>
                  <div><strong>Agência / Conta:</strong> {formData.agency} / {formData.accountNumber}-{formData.accountDigit}</div>
                  <div><strong>Chave PIX:</strong> {formData.pixKey || 'Não informada'} ({formData.pixKeyType})</div>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--status-success-bg)',
                border: '1px solid var(--status-success-border)',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <ShieldCheck size={24} color="var(--status-success)" />
              <div style={{ fontSize: 13, color: 'var(--status-success-text)' }}>
                <strong>Pronto para submissão:</strong> Todos os blocos obrigatórios foram devidamente preenchidos.
                Ao enviar, o status será atualizado e sua empresa estará disponível para consultas do time de Compras.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleFinalSubmit}
                disabled={saving}
              >
                <Send size={16} />
                {saving ? 'Enviando...' : 'Concluir e Enviar para Homologação'}
              </button>
            </div>
          </div>
        )}

        {/* Botões de Navegação Anterior / Próximo */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 32,
            paddingTop: 20,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleStepTransition(currentStep - 1)}
            disabled={currentStep === 1}
          >
            <ArrowLeft size={15} />
            Etapa Anterior
          </button>

          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Etapa {currentStep} de 8
          </span>

          {currentStep < 8 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleStepTransition(currentStep + 1)}
            >
              Próxima Etapa
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-accent"
              onClick={handleFinalSubmit}
              disabled={saving}
            >
              Finalizar Envio
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
