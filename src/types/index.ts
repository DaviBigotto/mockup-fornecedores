// ==============================================================================
// TIPOS E MODELOS DE DADOS - PLURIX ORGANIZER
// ==============================================================================

export type UserRole = 'fornecedor' | 'compras' | 'cadastro';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
}

// 1. Status do Cadastro / Homologação (Independente do ERP)
export type SupplierRegistrationStatus =
  | 'Pré-cadastro'
  | 'Em preenchimento'
  | 'Enviado'
  | 'Em validação'
  | 'Ajuste solicitado'
  | 'Cadastro completo'
  | 'Homologado'
  | 'Suspenso'
  | 'Inativo';

// 2. Status no ERP (Independente da Homologação)
export type ErpStatus =
  | 'Não verificado'
  | 'Não cadastrado'
  | 'Já cadastrado'
  | 'Encaminhado'
  | 'Em triagem'
  | 'Em cadastro'
  | 'Aguardando informação'
  | 'Concluído'
  | 'Cancelado';

// 3. Status da Situação Documental
export type DocumentStatus =
  | 'Não enviado'
  | 'Enviado'
  | 'Em validação'
  | 'Válido'
  | 'Pendente'
  | 'Vencendo'
  | 'Vencido'
  | 'Rejeitado';

// 4. Status de Etapas da Matriz pós-premiação
export type FlowStepStatus =
  | 'Não iniciada'
  | 'Em andamento'
  | 'Concluída'
  | 'Bloqueada'
  | 'Não aplicável';

export interface SupplierContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface SupplierAddress {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface BankAccount {
  id?: string;
  bankName: string;
  bankCode?: string;
  agency: string;
  accountNumber: string;
  accountDigit: string;
  accountType: 'Corrente' | 'Poupança';
  accountHolder: string;
  holderTaxId: string;
  pixKey?: string;
  pixKeyType?: 'CNPJ' | 'CPF' | 'E-mail' | 'Telefone' | 'Aleatória';
}

export interface Shareholder {
  id: string;
  name: string;
  document: string;
  equityPercentage: number;
  role: string;
}

export interface CommercialReference {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  relationshipDescription: string;
}

export interface SupplierDocument {
  id: string;
  supplierId: string;
  documentTypeCode: string;
  documentName: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileUrl?: string;
  issueDate?: string;
  expirationDate?: string;
  status: DocumentStatus;
  isMandatory: boolean;
  notes?: string;
  updatedAt?: string;
}

export interface SupplierPendingItem {
  id: string;
  supplierId: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'Pendente' | 'Em análise' | 'Resolvido';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  deadline?: string;
  createdAt: string;
}

export type ResponsibleArea = 'Aprovadores' | 'Compras' | 'Governança & ERP' | 'Integração' | 'Jurídico';

export type ErpInvestidaStatus =
  | 'Não solicitado'
  | 'Recebido'
  | 'Em triagem'
  | 'Aguardando ajuste'
  | 'Pronto para integração'
  | 'Em cadastro ERP'
  | 'Falha na integração'
  | 'Concluído'
  | 'Inativo'
  | 'Bloqueado';

export interface SupplierErpRegistration {
  id?: string;
  businessUnit: string;
  erpSystem: string;
  erpCode?: string;
  status: ErpInvestidaStatus;
  isBlocked: boolean;
  blockReason?: string;
  assignedAnalyst?: string;
  lastCheckedAt?: string;
  updatedAt: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  cnpj: string;
  corporateName: string;
  tradeName: string;
  legalNature?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  mainCnae?: string;
  openingDate?: string;
  companySize?: string;
  
  // Fiscais
  taxRegime?: string;
  simplesNacional?: boolean;
  ibsCbsRegime?: string;
  ibsCbsContributor?: boolean;
  taxClassification?: string;

  // Atuação e Cobertura
  mainCategory: string;
  categories: string[];
  subcategories?: string[];
  productsServices?: string;
  regions: string[];
  states: string[];
  businessUnits: string[];
  serviceCapacity?: string;
  marketExperienceYears?: number;
  estimatedEmployees?: number;

  // Status Centrais
  status: SupplierRegistrationStatus;
  erpStatus: ErpStatus;
  documentStatus: DocumentStatus;
  erpCode?: string;

  // Situação Detalhada nos ERPs das Investidas
  erpRegistrations?: SupplierErpRegistration[];

  // Wizard e Progresso
  completionPercentage: number;
  currentStep: number;
  draftData?: Record<string, any>;

  // Relacionamentos
  contacts?: SupplierContact[];
  address?: SupplierAddress;
  bankAccounts?: BankAccount[];
  shareholders?: Shareholder[];
  commercialReferences?: CommercialReference[];
  documents?: SupplierDocument[];
  pendingItems?: SupplierPendingItem[];

  createdAt: string;
  updatedAt: string;
}

export type DecisionPath = 'A' | 'B' | 'C' | 'D';

export interface DecisionFlowStep {
  id: string;
  stepIndex: number;
  stepName: string;
  description: string;
  status: FlowStepStatus;
  responsibleArea?: ResponsibleArea;
  responsiblePerson?: string;
  actionType?: 'concluir' | 'visualizar' | 'acompanhar';
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  pendencyReason?: string;
}

export interface DecisionFlow {
  id: string;
  awardId: string;
  supplierId: string;
  pathCode: DecisionPath;
  pathName: string;
  rationale: string;
  status: 'Não iniciado' | 'Em andamento' | 'Bloqueado' | 'Concluído';
  isReadyForPurchaseOrder: boolean;
  steps: DecisionFlowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface SourcingAward {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCnpj: string;
  sourcingProcessCode: string;
  businessUnit: string;
  category: string;
  contractValue: number;
  buyerName: string;
  hasErpRegistration: boolean;
  erpCode?: string;
  needsContract: boolean;
  notes?: string;
  status: 'Em andamento' | 'Concluído' | 'Cancelado';
  decisionFlow?: DecisionFlow;
  createdAt: string;
}

export interface ErpRequest {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCnpj: string;
  awardId?: string;
  requestCode: string;
  requestingUnit: string;
  category: string;
  requestedBy: string;
  currentStatus:
    | 'Recebido'
    | 'Em triagem'
    | 'Aguardando ajuste'
    | 'Aguardando informação'
    | 'Aguardando validação'
    | 'Pronto para integração'
    | 'Em cadastro'
    | 'Falha na integração'
    | 'Concluído'
    | 'Cancelado';
  determinedFlow: string;
  deadline: string;
  assignedAnalyst?: string;
  erpSupplierCode?: string;
  contractValue?: number;
  hasExistingErp: boolean;
  notes?: string;
  nextStep?: string;
  startDate?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEvent {
  id: string;
  supplierId: string;
  eventType: string;
  profile: 'Fornecedor' | 'Compras' | 'Time de Cadastro' | 'Sistema Organizer';
  userName: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  description?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  targetProfile: 'fornecedor' | 'compras' | 'cadastro' | 'all';
  title: string;
  message: string;
  linkUrl?: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
}

// Métricas de Compras (Calculadas dinamicamente)
export interface ProcurementMetrics {
  totalSuppliers: number;
  homologatedCount: number;
  completeCount: number;
  pendingCount: number;
  expiredDocsCount: number;
  expiringDocsCount: number;
  activeInErpCount: number;
  notInErpCount: number;
  newSuppliersMonth: number;
  coverageByCategory: { category: string; count: number; homologated: number }[];
  coverageByRegion: { region: string; count: number }[];
  coverageByUnit: { unit: string; count: number }[];
  lowCoverageCategories: string[];
}

// Métricas de Cadastro / ERP (Calculadas dinamicamente)
export interface ErpQueueMetrics {
  totalRequests: number;
  pendingCount: number;
  inProgressCount: number;
  waitingAdjustmentCount: number;
  completedCount: number;
  onTimeCount: number;
  delayedCount: number;
}
