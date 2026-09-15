// ==============================================================================
// REPOSITÓRIO CENTRAL DE DADOS - PLURIX ORGANIZER
// Integração Híbrida: Neon PostgreSQL Transacional com Fallback Local
// ==============================================================================

import {
  Supplier,
  SourcingAward,
  ErpRequest,
  StatusHistoryEvent,
  NotificationItem,
  ProcurementMetrics,
  ErpQueueMetrics,
  FlowStepStatus,
  User,
  UserRole,
} from '../../src/types/index.js';
import {
  INITIAL_SUPPLIERS,
  INITIAL_AWARDS,
  INITIAL_ERP_REQUESTS,
  INITIAL_HISTORY,
  INITIAL_NOTIFICATIONS,
} from './mockData.js';
import { buildDecisionFlow } from '../../src/services/decisionMatrix.js';
import { getPool } from './client.js';
import bcrypt from 'bcryptjs';

// Estado em memória (fallback e cache de sessão)
let usersStore: (User & { passwordHash?: string })[] = [];
let suppliersStore: Supplier[] = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
let awardsStore: SourcingAward[] = JSON.parse(JSON.stringify(INITIAL_AWARDS));
let erpRequestsStore: ErpRequest[] = JSON.parse(JSON.stringify(INITIAL_ERP_REQUESTS));
let historyStore: StatusHistoryEvent[] = JSON.parse(JSON.stringify(INITIAL_HISTORY));
let notificationsStore: NotificationItem[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));

// ----------------------------------------------------------------------------
// FUNÇÕES DE MAPEAMENTO SQL <-> DOMÍNIO
// ----------------------------------------------------------------------------
function rowToUser(row: any): User & { passwordHash?: string } {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    companyName: row.company_name || undefined,
    passwordHash: row.password_hash || undefined,
  };
}
function rowToSupplier(row: any): Supplier {
  return {
    id: row.id,
    cnpj: row.cnpj,
    corporateName: row.corporate_name,
    tradeName: row.trade_name,
    legalNature: row.legal_nature || undefined,
    stateRegistration: row.state_registration || undefined,
    municipalRegistration: row.municipal_registration || undefined,
    mainCnae: row.main_cnae || undefined,
    openingDate: row.opening_date instanceof Date ? row.opening_date.toISOString().split('T')[0] : (row.opening_date || undefined),
    companySize: row.company_size || undefined,
    taxRegime: row.tax_regime || undefined,
    simplesNacional: !!row.simples_nacional,
    ibsCbsRegime: row.ibs_cbs_regime || undefined,
    ibsCbsContributor: row.ibs_cbs_contributor !== false,
    taxClassification: row.tax_classification || undefined,
    mainCategory: row.main_category,
    categories: Array.isArray(row.categories) ? row.categories : (typeof row.categories === 'string' ? JSON.parse(row.categories) : []),
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : (typeof row.subcategories === 'string' ? JSON.parse(row.subcategories) : []),
    productsServices: row.products_services || undefined,
    regions: Array.isArray(row.regions) ? row.regions : (typeof row.regions === 'string' ? JSON.parse(row.regions) : []),
    states: Array.isArray(row.states) ? row.states : (typeof row.states === 'string' ? JSON.parse(row.states) : []),
    businessUnits: Array.isArray(row.business_units) ? row.business_units : (typeof row.business_units === 'string' ? JSON.parse(row.business_units) : []),
    serviceCapacity: row.service_capacity || undefined,
    marketExperienceYears: row.market_experience_years || 0,
    estimatedEmployees: row.estimated_employees || 0,
    status: row.status,
    erpStatus: row.erp_status,
    documentStatus: row.document_status,
    erpCode: row.erp_code || undefined,
    completionPercentage: row.completion_percentage || 15,
    currentStep: row.current_step || 1,
    draftData: row.draft_data || {},
    contacts: Array.isArray(row.contacts) ? row.contacts : (typeof row.contacts === 'string' ? JSON.parse(row.contacts) : []),
    address: row.address || {},
    bankAccounts: Array.isArray(row.bank_accounts) ? row.bank_accounts : (typeof row.bank_accounts === 'string' ? JSON.parse(row.bank_accounts) : []),
    shareholders: Array.isArray(row.shareholders) ? row.shareholders : (typeof row.shareholders === 'string' ? JSON.parse(row.shareholders) : []),
    commercialReferences: Array.isArray(row.commercial_references) ? row.commercial_references : (typeof row.commercial_references === 'string' ? JSON.parse(row.commercial_references) : []),
    documents: Array.isArray(row.documents) ? row.documents : (typeof row.documents === 'string' ? JSON.parse(row.documents) : []),
    pendingItems: Array.isArray(row.pending_items) ? row.pending_items : (typeof row.pending_items === 'string' ? JSON.parse(row.pending_items) : []),
    createdBy: row.created_by || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function rowToAward(row: any): SourcingAward {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    supplierCnpj: row.supplier_cnpj,
    sourcingProcessCode: row.sourcing_process_code,
    businessUnit: row.business_unit,
    category: row.category,
    contractValue: parseFloat(row.contract_value) || 0,
    buyerName: row.buyer_name,
    hasErpRegistration: !!row.has_erp_registration,
    erpCode: row.erp_code || undefined,
    needsContract: !!row.needs_contract,
    notes: row.notes || undefined,
    status: row.status,
    decisionFlow: typeof row.decision_flow === 'string' ? JSON.parse(row.decision_flow) : (row.decision_flow || undefined),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function rowToErpRequest(row: any): ErpRequest {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    supplierCnpj: row.supplier_cnpj,
    awardId: row.award_id || undefined,
    requestCode: row.request_code,
    requestingUnit: row.requesting_unit,
    category: row.category,
    requestedBy: row.requested_by,
    currentStatus: row.current_status,
    determinedFlow: row.determined_flow,
    deadline: row.deadline instanceof Date ? row.deadline.toISOString().split('T')[0] : (row.deadline || ''),
    assignedAnalyst: row.assigned_analyst || undefined,
    erpSupplierCode: row.erp_supplier_code || undefined,
    hasExistingErp: !!row.has_existing_erp,
    contractValue: row.contract_value ? parseFloat(row.contract_value) : undefined,
    notes: row.notes || undefined,
    nextStep: row.next_step || undefined,
    startDate: row.start_date instanceof Date ? row.start_date.toISOString().split('T')[0] : (row.start_date || undefined),
    completionDate: row.completion_date instanceof Date ? row.completion_date.toISOString().split('T')[0] : (row.completion_date || undefined),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function rowToHistory(row: any): StatusHistoryEvent {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    eventType: row.event_type,
    profile: row.profile,
    userName: row.user_name,
    action: row.action,
    previousStatus: row.previous_status || undefined,
    newStatus: row.new_status || undefined,
    description: row.description || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function rowToNotification(row: any): NotificationItem {
  return {
    id: row.id,
    targetProfile: row.target_profile,
    title: row.title,
    message: row.message,
    linkUrl: row.link_url || undefined,
    type: row.type || 'info',
    isRead: !!row.is_read,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export const repository = {
  // --------------------------------------------------------------------------
  // FORNECEDORES
  // --------------------------------------------------------------------------
  async getAllSuppliers(): Promise<Supplier[]> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(`SELECT * FROM suppliers ORDER BY updated_at DESC`);
        return res.rows.map(rowToSupplier);
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar fornecedores do Neon, usando fallback:', err.message);
      }
    }
    return [...suppliersStore];
  },

  async getSupplierById(id: string): Promise<Supplier | undefined> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(`SELECT * FROM suppliers WHERE id = $1`, [id]);
        if (res.rows.length > 0) {
          return rowToSupplier(res.rows[0]);
        }
        return undefined;
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar fornecedor por ID do Neon:', err.message);
      }
    }
    return suppliersStore.find((s) => s.id === id);
  },

  async getSupplierByCnpj(cnpj: string): Promise<Supplier | undefined> {
    const clean = cnpj.replace(/\D/g, '');
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT * FROM suppliers WHERE regexp_replace(cnpj, '\\D', '', 'g') = $1 LIMIT 1`,
          [clean]
        );
        if (res.rows.length > 0) {
          return rowToSupplier(res.rows[0]);
        }
        return undefined;
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar fornecedor por CNPJ do Neon:', err.message);
      }
    }
    return suppliersStore.find((s) => s.cnpj.replace(/\D/g, '') === clean);
  },

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const now = new Date().toISOString();
    const newId = `sup-${Date.now()}`;
    const newSupplier: Supplier = {
      id: newId,
      cnpj: data.cnpj || '',
      corporateName: data.corporateName || '',
      tradeName: data.tradeName || data.corporateName || '',
      legalNature: data.legalNature || '206-2 - Sociedade Empresária Limitada',
      stateRegistration: data.stateRegistration,
      municipalRegistration: data.municipalRegistration,
      mainCnae: data.mainCnae,
      openingDate: data.openingDate,
      companySize: data.companySize || 'Médio Porte',
      taxRegime: data.taxRegime || 'Lucro Presumido',
      simplesNacional: !!data.simplesNacional,
      ibsCbsRegime: data.ibsCbsRegime || 'Não Cumulativo Pleno',
      ibsCbsContributor: data.ibsCbsContributor !== false,
      taxClassification: data.taxClassification,
      mainCategory: data.mainCategory || 'Geral',
      categories: data.categories || ['Geral'],
      subcategories: data.subcategories || [],
      productsServices: data.productsServices,
      regions: data.regions || ['Sudeste'],
      states: data.states || ['SP'],
      businessUnits: data.businessUnits || ['Unidade Corporativa SP'],
      serviceCapacity: data.serviceCapacity,
      marketExperienceYears: data.marketExperienceYears || 0,
      estimatedEmployees: data.estimatedEmployees || 0,
      status: 'Pré-cadastro',
      erpStatus: 'Não cadastrado',
      documentStatus: 'Não enviado',
      completionPercentage: 15,
      currentStep: 1,
      draftData: data.draftData || {},
      contacts: data.contacts || [],
      address: data.address || {
        zipCode: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: 'SP',
      },
      bankAccounts: data.bankAccounts || [],
      shareholders: data.shareholders || [],
      commercialReferences: data.commercialReferences || [],
      documents: data.documents || [],
      pendingItems: [],
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // Neon PostgreSQL Insert
    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO suppliers (
            id, cnpj, corporate_name, trade_name, legal_nature, state_registration, municipal_registration,
            main_cnae, opening_date, company_size, tax_regime, simples_nacional, ibs_cbs_regime, ibs_cbs_contributor,
            tax_classification, main_category, categories, subcategories, products_services, regions, states,
            business_units, service_capacity, market_experience_years, estimated_employees, status, erp_status,
            document_status, erp_code, completion_percentage, current_step, draft_data, contacts, address,
            bank_accounts, shareholders, commercial_references, documents, pending_items, created_by, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17::jsonb, $18::jsonb, $19, $20::jsonb, $21::jsonb, $22::jsonb, $23, $24, $25, $26,
            $27, $28, $29, $30, $31, $32::jsonb, $33::jsonb, $34::jsonb, $35::jsonb, $36::jsonb,
            $37::jsonb, $38::jsonb, $39::jsonb, $40, $41, $42
          )`,
          [
            newSupplier.id,
            newSupplier.cnpj,
            newSupplier.corporateName,
            newSupplier.tradeName,
            newSupplier.legalNature || null,
            newSupplier.stateRegistration || null,
            newSupplier.municipalRegistration || null,
            newSupplier.mainCnae || null,
            newSupplier.openingDate || null,
            newSupplier.companySize || null,
            newSupplier.taxRegime || null,
            newSupplier.simplesNacional,
            newSupplier.ibsCbsRegime || null,
            newSupplier.ibsCbsContributor,
            newSupplier.taxClassification || null,
            newSupplier.mainCategory,
            JSON.stringify(newSupplier.categories),
            JSON.stringify(newSupplier.subcategories || []),
            newSupplier.productsServices || null,
            JSON.stringify(newSupplier.regions),
            JSON.stringify(newSupplier.states),
            JSON.stringify(newSupplier.businessUnits),
            newSupplier.serviceCapacity || null,
            newSupplier.marketExperienceYears,
            newSupplier.estimatedEmployees,
            newSupplier.status,
            newSupplier.erpStatus,
            newSupplier.documentStatus,
            newSupplier.erpCode || null,
            newSupplier.completionPercentage,
            newSupplier.currentStep,
            JSON.stringify(newSupplier.draftData || {}),
            JSON.stringify(newSupplier.contacts || []),
            JSON.stringify(newSupplier.address || {}),
            JSON.stringify(newSupplier.bankAccounts || []),
            JSON.stringify(newSupplier.shareholders || []),
            JSON.stringify(newSupplier.commercialReferences || []),
            JSON.stringify(newSupplier.documents || []),
            JSON.stringify(newSupplier.pendingItems || []),
            newSupplier.createdBy || null,
            newSupplier.createdAt,
            newSupplier.updatedAt,
          ]
        );
      } catch (err: any) {
        console.error('[DB] Erro ao persistir fornecedor no Neon:', err.message);
      }
    }

    suppliersStore.unshift(newSupplier);

    // Registro no histórico de auditoria
    await this.addHistoryEvent({
      supplierId: newId,
      eventType: 'PRE_CADASTRO_REALIZADO',
      profile: 'Fornecedor',
      userName: data.contacts?.[0]?.name || 'Representante Legal',
      action: 'Pré-cadastro Realizado',
      previousStatus: 'Não existente',
      newStatus: 'Pré-cadastro',
      description: 'Criação inicial da conta de acesso e dados cadastrais básicos no portal.',
    });

    // Notificação para Compras
    await this.addNotification({
      targetProfile: 'compras',
      title: 'Novo Pré-cadastro Iniciado',
      message: `${newSupplier.tradeName} iniciou o processo de credenciamento.`,
      type: 'info',
    });

    return newSupplier;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>, actor = 'Fornecedor'): Promise<Supplier | undefined> {
    const current = await this.getSupplierById(id);
    if (!current) return undefined;

    const prevStatus = current.status;
    const prevErpStatus = current.erpStatus;
    const now = new Date().toISOString();

    const updated: Supplier = {
      ...current,
      ...updates,
      updatedAt: now,
    };

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE suppliers SET
            corporate_name = COALESCE($2, corporate_name),
            trade_name = COALESCE($3, trade_name),
            legal_nature = COALESCE($4, legal_nature),
            state_registration = COALESCE($5, state_registration),
            municipal_registration = COALESCE($6, municipal_registration),
            main_cnae = COALESCE($7, main_cnae),
            opening_date = COALESCE($8, opening_date),
            company_size = COALESCE($9, company_size),
            tax_regime = COALESCE($10, tax_regime),
            simples_nacional = COALESCE($11, simples_nacional),
            ibs_cbs_regime = COALESCE($12, ibs_cbs_regime),
            ibs_cbs_contributor = COALESCE($13, ibs_cbs_contributor),
            tax_classification = COALESCE($14, tax_classification),
            main_category = COALESCE($15, main_category),
            categories = COALESCE($16::jsonb, categories),
            subcategories = COALESCE($17::jsonb, subcategories),
            products_services = COALESCE($18, products_services),
            regions = COALESCE($19::jsonb, regions),
            states = COALESCE($20::jsonb, states),
            business_units = COALESCE($21::jsonb, business_units),
            service_capacity = COALESCE($22, service_capacity),
            market_experience_years = COALESCE($23, market_experience_years),
            estimated_employees = COALESCE($24, estimated_employees),
            status = COALESCE($25, status),
            erp_status = COALESCE($26, erp_status),
            document_status = COALESCE($27, document_status),
            erp_code = COALESCE($28, erp_code),
            completion_percentage = COALESCE($29, completion_percentage),
            current_step = COALESCE($30, current_step),
            draft_data = COALESCE($31::jsonb, draft_data),
            contacts = COALESCE($32::jsonb, contacts),
            address = COALESCE($33::jsonb, address),
            bank_accounts = COALESCE($34::jsonb, bank_accounts),
            shareholders = COALESCE($35::jsonb, shareholders),
            commercial_references = COALESCE($36::jsonb, commercial_references),
            documents = COALESCE($37::jsonb, documents),
            pending_items = COALESCE($38::jsonb, pending_items),
            created_by = COALESCE($39, created_by),
            updated_at = $40
          WHERE id = $1`,
          [
            id,
            updates.corporateName || null,
            updates.tradeName || null,
            updates.legalNature || null,
            updates.stateRegistration || null,
            updates.municipalRegistration || null,
            updates.mainCnae || null,
            updates.openingDate || null,
            updates.companySize || null,
            updates.taxRegime || null,
            updates.simplesNacional !== undefined ? updates.simplesNacional : null,
            updates.ibsCbsRegime || null,
            updates.ibsCbsContributor !== undefined ? updates.ibsCbsContributor : null,
            updates.taxClassification || null,
            updates.mainCategory || null,
            updates.categories ? JSON.stringify(updates.categories) : null,
            updates.subcategories ? JSON.stringify(updates.subcategories) : null,
            updates.productsServices || null,
            updates.regions ? JSON.stringify(updates.regions) : null,
            updates.states ? JSON.stringify(updates.states) : null,
            updates.businessUnits ? JSON.stringify(updates.businessUnits) : null,
            updates.serviceCapacity || null,
            updates.marketExperienceYears !== undefined ? updates.marketExperienceYears : null,
            updates.estimatedEmployees !== undefined ? updates.estimatedEmployees : null,
            updates.status || null,
            updates.erpStatus || null,
            updates.documentStatus || null,
            updates.erpCode || null,
            updates.completionPercentage !== undefined ? updates.completionPercentage : null,
            updates.currentStep !== undefined ? updates.currentStep : null,
            updates.draftData ? JSON.stringify(updates.draftData) : null,
            updates.contacts ? JSON.stringify(updates.contacts) : null,
            updates.address ? JSON.stringify(updates.address) : null,
            updates.bankAccounts ? JSON.stringify(updates.bankAccounts) : null,
            updates.shareholders ? JSON.stringify(updates.shareholders) : null,
            updates.commercialReferences ? JSON.stringify(updates.commercialReferences) : null,
            updates.documents ? JSON.stringify(updates.documents) : null,
            updates.pendingItems ? JSON.stringify(updates.pendingItems) : null,
            updates.createdBy || null,
            now,
          ]
        );
      } catch (err: any) {
        console.error('[DB] Erro ao atualizar fornecedor no Neon:', err.message);
      }
    }

    // Atualiza store local
    const localIndex = suppliersStore.findIndex((s) => s.id === id);
    if (localIndex >= 0) {
      suppliersStore[localIndex] = updated;
    }

    // Auditoria de mudança de status
    if (updates.status && updates.status !== prevStatus) {
      await this.addHistoryEvent({
        supplierId: id,
        eventType: 'STATUS_CADASTRAL_ALTERADO',
        profile: actor.includes('Compras') ? 'Compras' : actor.includes('Cadastro') ? 'Time de Cadastro' : 'Fornecedor',
        userName: actor,
        action: 'Atualização de Situação Cadastral',
        previousStatus: prevStatus,
        newStatus: updates.status,
        description: `Status cadastral atualizado de "${prevStatus}" para "${updates.status}".`,
      });
    }

    // Auditoria de mudança no ERP
    if (updates.erpStatus && updates.erpStatus !== prevErpStatus) {
      await this.addHistoryEvent({
        supplierId: id,
        eventType: 'STATUS_ERP_ALTERADO',
        profile: 'Time de Cadastro',
        userName: actor,
        action: 'Atualização de Situação no ERP',
        previousStatus: prevErpStatus,
        newStatus: updates.erpStatus,
        description: `Situação no ERP modificada para "${updates.erpStatus}". ${updates.erpCode ? `Código atribuído: ${updates.erpCode}` : ''}`,
      });
    }

    return updated;
  },

  // --------------------------------------------------------------------------
  // SOURCING AWARDS & MATRIZ DE DECISÃO
  // --------------------------------------------------------------------------
  async getAllAwards(): Promise<SourcingAward[]> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(`SELECT * FROM sourcing_awards ORDER BY created_at DESC`);
        return res.rows.map(rowToAward);
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar premiações do Neon:', err.message);
      }
    }
    return [...awardsStore];
  },

  async getAwardById(id: string): Promise<SourcingAward | undefined> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(`SELECT * FROM sourcing_awards WHERE id = $1`, [id]);
        if (res.rows.length > 0) {
          return rowToAward(res.rows[0]);
        }
        return undefined;
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar premiação por ID do Neon:', err.message);
      }
    }
    return awardsStore.find((a) => a.id === id);
  },

  async createAward(data: {
    supplierId: string;
    sourcingProcessCode: string;
    businessUnit: string;
    category: string;
    contractValue: number;
    buyerName: string;
    hasErpRegistration: boolean;
    erpCode?: string;
    needsContract: boolean;
    notes?: string;
  }): Promise<SourcingAward> {
    const supplier = await this.getSupplierById(data.supplierId);
    if (!supplier) throw new Error('Fornecedor não localizado.');

    const awardId = `aw-${Date.now()}`;
    const now = new Date().toISOString();

    const decisionFlow = buildDecisionFlow(awardId, data.supplierId, {
      supplierId: data.supplierId,
      hasErpRegistration: data.hasErpRegistration,
      contractValue: data.contractValue,
      needsContract: data.needsContract,
    });

    const newAward: SourcingAward = {
      id: awardId,
      supplierId: data.supplierId,
      supplierName: supplier.tradeName || supplier.corporateName,
      supplierCnpj: supplier.cnpj,
      sourcingProcessCode: data.sourcingProcessCode,
      businessUnit: data.businessUnit,
      category: data.category,
      contractValue: data.contractValue,
      buyerName: data.buyerName,
      hasErpRegistration: data.hasErpRegistration,
      erpCode: data.erpCode,
      needsContract: data.needsContract,
      notes: data.notes,
      status: 'Em andamento',
      decisionFlow,
      createdAt: now,
    };

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO sourcing_awards (
            id, supplier_id, supplier_name, supplier_cnpj, sourcing_process_code, business_unit,
            category, contract_value, buyer_name, has_erp_registration, erp_code, needs_contract,
            notes, status, decision_flow, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16)`,
          [
            newAward.id,
            newAward.supplierId,
            newAward.supplierName,
            newAward.supplierCnpj,
            newAward.sourcingProcessCode,
            newAward.businessUnit,
            newAward.category,
            newAward.contractValue,
            newAward.buyerName,
            newAward.hasErpRegistration,
            newAward.erpCode || null,
            newAward.needsContract,
            newAward.notes || null,
            newAward.status,
            JSON.stringify(newAward.decisionFlow),
            newAward.createdAt,
          ]
        );
      } catch (err: any) {
        console.error('[DB] Erro ao inserir premiação no Neon:', err.message);
      }
    }

    awardsStore.unshift(newAward);

    // Registra no histórico do fornecedor
    await this.addHistoryEvent({
      supplierId: data.supplierId,
      eventType: 'FORNECEDOR_PREMIADO',
      profile: 'Compras',
      userName: data.buyerName,
      action: 'Fornecedor Premiado em Sourcing',
      previousStatus: supplier.erpStatus,
      newStatus: `Premiado - ${decisionFlow.pathName}`,
      description: `Processo ${data.sourcingProcessCode} registrado. Matriz determinou ${decisionFlow.pathCode} (${decisionFlow.pathName}).`,
    });

    // Se for Caminho A ou B (sem cadastro ERP), cria automaticamente solicitação na fila ERP
    if (!data.hasErpRegistration) {
      await this.createErpRequest({
        supplierId: data.supplierId,
        awardId: awardId,
        requestingUnit: data.businessUnit,
        category: data.category,
        requestedBy: data.buyerName,
        determinedFlow: `Caminho ${decisionFlow.pathCode}`,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        hasExistingErp: false,
        contractValue: data.contractValue,
        notes: `Solicitação originada do processo de sourcing ${data.sourcingProcessCode}. ${data.notes || ''}`,
        nextStep:
          decisionFlow.pathCode === 'A'
            ? 'Triagem e validação cadastral simplificada'
            : 'Acompanhar conclusão de BC Legal e assinatura contratual',
      });

      await this.updateSupplier(
        data.supplierId,
        {
          erpStatus: 'Encaminhado',
        },
        'Sistema Organizer'
      );
    }

    // Notificação para Cadastro
    await this.addNotification({
      targetProfile: 'cadastro',
      title: 'Fornecedor Premiado Encaminhado',
      message: `${supplier.tradeName} premiado no valor de R$ ${data.contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Matriz: ${decisionFlow.pathCode}.`,
      type: 'info',
    });

    return newAward;
  },

  async updateAwardStepStatus(
    awardId: string,
    stepIndex: number,
    newStatus: FlowStepStatus,
    notes?: string
  ): Promise<SourcingAward | undefined> {
    const award = await this.getAwardById(awardId);
    if (!award || !award.decisionFlow) return undefined;

    const step = award.decisionFlow.steps.find((s) => s.stepIndex === stepIndex);
    if (step) {
      step.status = newStatus;
      if (notes) step.notes = notes;
      if (newStatus === 'Concluída') {
        step.completedAt = new Date().toISOString();
      }
    }

    const applicableSteps = award.decisionFlow.steps.filter((s) => s.status !== 'Não aplicável');
    const allCompleted = applicableSteps.every((s) => s.status === 'Concluída');

    if (allCompleted) {
      award.decisionFlow.status = 'Concluído';
      award.decisionFlow.isReadyForPurchaseOrder = true;
      award.status = 'Concluído';

      await this.addHistoryEvent({
        supplierId: award.supplierId,
        eventType: 'ETAPAS_SOURCING_CONCLUIDAS',
        profile: 'Compras',
        userName: award.buyerName,
        action: 'Liberação para Pedido de Compra',
        previousStatus: 'Em andamento',
        newStatus: 'Apto para Emissão do Pedido',
        description: 'Todas as etapas da matriz foram concluídas. Fornecedor apto para emissão da ordem de compra.',
      });

      await this.addNotification({
        targetProfile: 'compras',
        title: 'Fornecedor Apto para Pedido',
        message: `${award.supplierName} concluiu todas as etapas pós-premiação e está apto para emissão do pedido.`,
        type: 'success',
      });
    }

    award.decisionFlow.updatedAt = new Date().toISOString();

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE sourcing_awards SET status = $2, decision_flow = $3::jsonb WHERE id = $1`,
          [awardId, award.status, JSON.stringify(award.decisionFlow)]
        );
      } catch (err: any) {
        console.error('[DB] Erro ao atualizar etapa da premiação no Neon:', err.message);
      }
    }

    const localIdx = awardsStore.findIndex((a) => a.id === awardId);
    if (localIdx >= 0) awardsStore[localIdx] = award;

    return award;
  },

  // --------------------------------------------------------------------------
  // FILA DO TIME DE CADASTRO / ERP
  // --------------------------------------------------------------------------
  async getAllErpRequests(): Promise<ErpRequest[]> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(`SELECT * FROM erp_requests ORDER BY created_at DESC`);
        return res.rows.map(rowToErpRequest);
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar solicitações ERP do Neon:', err.message);
      }
    }
    return [...erpRequestsStore];
  },

  async getErpRequestById(id: string): Promise<ErpRequest | undefined> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(`SELECT * FROM erp_requests WHERE id = $1`, [id]);
        if (res.rows.length > 0) {
          return rowToErpRequest(res.rows[0]);
        }
        return undefined;
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar solicitação ERP por ID do Neon:', err.message);
      }
    }
    return erpRequestsStore.find((r) => r.id === id);
  },

  async createErpRequest(data: {
    supplierId: string;
    awardId?: string;
    requestingUnit: string;
    category: string;
    requestedBy: string;
    determinedFlow: string;
    deadline: string;
    hasExistingErp: boolean;
    contractValue?: number;
    notes?: string;
    nextStep?: string;
  }): Promise<ErpRequest> {
    const supplier = await this.getSupplierById(data.supplierId);
    const now = new Date().toISOString();
    const all = await this.getAllErpRequests();
    const reqCode = `CAD-2025-${String(all.length + 45).padStart(4, '0')}`;

    const newRequest: ErpRequest = {
      id: `req-${Date.now()}`,
      supplierId: data.supplierId,
      supplierName: supplier ? supplier.tradeName : 'Fornecedor',
      supplierCnpj: supplier ? supplier.cnpj : '',
      awardId: data.awardId,
      requestCode: reqCode,
      requestingUnit: data.requestingUnit,
      category: data.category,
      requestedBy: data.requestedBy,
      currentStatus: 'Recebido',
      determinedFlow: data.determinedFlow,
      deadline: data.deadline,
      assignedAnalyst: 'Roberto Valente',
      hasExistingErp: data.hasExistingErp,
      contractValue: data.contractValue,
      notes: data.notes,
      nextStep: data.nextStep || 'Triagem cadastral inicial',
      startDate: new Date().toISOString().split('T')[0],
      createdAt: now,
      updatedAt: now,
    };

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO erp_requests (
            id, supplier_id, supplier_name, supplier_cnpj, award_id, request_code, requesting_unit,
            category, requested_by, current_status, determined_flow, deadline, assigned_analyst,
            erp_supplier_code, has_existing_erp, contract_value, notes, next_step, start_date,
            completion_date, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
          )`,
          [
            newRequest.id,
            newRequest.supplierId,
            newRequest.supplierName,
            newRequest.supplierCnpj,
            newRequest.awardId || null,
            newRequest.requestCode,
            newRequest.requestingUnit,
            newRequest.category,
            newRequest.requestedBy,
            newRequest.currentStatus,
            newRequest.determinedFlow,
            newRequest.deadline,
            newRequest.assignedAnalyst || null,
            newRequest.erpSupplierCode || null,
            newRequest.hasExistingErp,
            newRequest.contractValue || null,
            newRequest.notes || null,
            newRequest.nextStep || null,
            newRequest.startDate || null,
            newRequest.completionDate || null,
            newRequest.createdAt,
            newRequest.updatedAt,
          ]
        );
      } catch (err: any) {
        console.error('[DB] Erro ao inserir solicitação ERP no Neon:', err.message);
      }
    }

    erpRequestsStore.unshift(newRequest);
    return newRequest;
  },

  async updateErpRequestStatus(
    id: string,
    updates: {
      status: ErpRequest['currentStatus'];
      assignedAnalyst?: string;
      erpSupplierCode?: string;
      notes?: string;
      nextStep?: string;
      userName?: string;
    }
  ): Promise<ErpRequest | undefined> {
    const current = await this.getErpRequestById(id);
    if (!current) return undefined;

    const prevStatus = current.currentStatus;
    const now = new Date().toISOString();

    const updated: ErpRequest = {
      ...current,
      currentStatus: updates.status,
      assignedAnalyst: updates.assignedAnalyst || current.assignedAnalyst,
      erpSupplierCode: updates.erpSupplierCode || current.erpSupplierCode,
      notes: updates.notes !== undefined ? updates.notes : current.notes,
      nextStep: updates.nextStep !== undefined ? updates.nextStep : current.nextStep,
      completionDate: updates.status === 'Concluído' ? now.split('T')[0] : current.completionDate,
      updatedAt: now,
    };

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE erp_requests SET
            current_status = $2,
            assigned_analyst = $3,
            erp_supplier_code = $4,
            notes = $5,
            next_step = $6,
            completion_date = $7,
            updated_at = $8
          WHERE id = $1`,
          [
            id,
            updated.currentStatus,
            updated.assignedAnalyst || null,
            updated.erpSupplierCode || null,
            updated.notes || null,
            updated.nextStep || null,
            updated.completionDate || null,
            now,
          ]
        );
      } catch (err: any) {
        console.error('[DB] Erro ao atualizar solicitação ERP no Neon:', err.message);
      }
    }

    const localIdx = erpRequestsStore.findIndex((r) => r.id === id);
    if (localIdx >= 0) erpRequestsStore[localIdx] = updated;

    // Sincroniza fornecedor principal
    let supplierErpStatus = current.hasExistingErp ? 'Já cadastrado' : 'Em cadastro';
    if (updates.status === 'Concluído') {
      supplierErpStatus = 'Concluído';
    } else if (updates.status === 'Em triagem') {
      supplierErpStatus = 'Em triagem';
    } else if (updates.status === 'Aguardando informação') {
      supplierErpStatus = 'Aguardando informação';
    } else if (updates.status === 'Cancelado') {
      supplierErpStatus = 'Cancelado';
    }

    await this.updateSupplier(
      current.supplierId,
      {
        erpStatus: supplierErpStatus as any,
        erpCode: updates.erpSupplierCode || undefined,
      },
      updates.userName || 'Time de Cadastro'
    );

    // Auditoria
    await this.addHistoryEvent({
      supplierId: current.supplierId,
      eventType: 'OPERACAO_ERP_ATUALIZADA',
      profile: 'Time de Cadastro',
      userName: updates.userName || 'Roberto Valente',
      action: `Fila ERP: ${updates.status}`,
      previousStatus: prevStatus,
      newStatus: updates.status,
      description: `Solicitação ${current.requestCode} alterada para "${updates.status}". ${updates.notes ? `Obs: ${updates.notes}` : ''}`,
    });

    return updated;
  },

  // --------------------------------------------------------------------------
  // HISTÓRICO E AUDITORIA
  // --------------------------------------------------------------------------
  async getAllHistoryEvents(): Promise<StatusHistoryEvent[]> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT * FROM supplier_status_history ORDER BY created_at DESC LIMIT 200`
        );
        return res.rows.map(rowToHistory);
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar histórico global do Neon:', err.message);
      }
    }
    return [...historyStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getHistoryBySupplierId(supplierId: string): Promise<StatusHistoryEvent[]> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT * FROM supplier_status_history WHERE supplier_id = $1 ORDER BY created_at DESC`,
          [supplierId]
        );
        return res.rows.map(rowToHistory);
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar histórico do Neon:', err.message);
      }
    }
    return historyStore
      .filter((h) => h.supplierId === supplierId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addHistoryEvent(event: Omit<StatusHistoryEvent, 'id' | 'createdAt'>): Promise<StatusHistoryEvent> {
    const newEvent: StatusHistoryEvent = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...event,
      createdAt: new Date().toISOString(),
    };

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO supplier_status_history (
            id, supplier_id, event_type, profile, user_name, action, previous_status, new_status, description, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            newEvent.id,
            newEvent.supplierId,
            newEvent.eventType,
            newEvent.profile,
            newEvent.userName,
            newEvent.action,
            newEvent.previousStatus || null,
            newEvent.newStatus || null,
            newEvent.description || null,
            newEvent.createdAt,
          ]
        );
      } catch (err: any) {
        console.error('[DB] Erro ao inserir histórico no Neon:', err.message);
      }
    }

    historyStore.unshift(newEvent);
    return newEvent;
  },

  // --------------------------------------------------------------------------
  // NOTIFICAÇÕES
  // --------------------------------------------------------------------------
  async getNotifications(profile?: string): Promise<NotificationItem[]> {
    const pool = getPool();
    if (pool) {
      try {
        let query = `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`;
        let params: any[] = [];
        if (profile && profile !== 'all') {
          query = `SELECT * FROM notifications WHERE target_profile = $1 OR target_profile = 'all' ORDER BY created_at DESC LIMIT 50`;
          params = [profile];
        }
        const res = await pool.query(query, params);
        return res.rows.map(rowToNotification);
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar notificações do Neon:', err.message);
      }
    }

    if (!profile || profile === 'all') return [...notificationsStore];
    return notificationsStore.filter((n) => n.targetProfile === profile || n.targetProfile === 'all');
  },

  async markNotificationRead(id: string): Promise<void> {
    const pool = getPool();
    if (pool) {
      try {
        await pool.query(`UPDATE notifications SET is_read = true WHERE id = $1`, [id]);
      } catch (err: any) {
        console.error('[DB] Erro ao marcar notificação como lida no Neon:', err.message);
      }
    }
    const item = notificationsStore.find((n) => n.id === id);
    if (item) item.isRead = true;
  },

  async addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): Promise<NotificationItem> {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      ...notif,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO notifications (id, target_profile, title, message, link_url, type, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            newNotif.id,
            newNotif.targetProfile,
            newNotif.title,
            newNotif.message,
            newNotif.linkUrl || null,
            newNotif.type,
            newNotif.isRead,
            newNotif.createdAt,
          ]
        );
      } catch (err: any) {
        console.error('[DB] Erro ao inserir notificação no Neon:', err.message);
      }
    }

    notificationsStore.unshift(newNotif);
    return newNotif;
  },

  // --------------------------------------------------------------------------
  // MÉTRICAS CALCULADAS DINAMICAMENTE
  // --------------------------------------------------------------------------
  async getProcurementMetrics(): Promise<ProcurementMetrics> {
    const all = await this.getAllSuppliers();
    const totalSuppliers = all.length;
    const homologatedCount = all.filter((s) => s.status === 'Homologado').length;
    const completeCount = all.filter((s) => s.status === 'Cadastro completo').length;
    const pendingCount = all.filter((s) => s.status === 'Ajuste solicitado' || s.documentStatus === 'Pendente').length;
    const expiredDocsCount = all.filter((s) => s.documentStatus === 'Vencido').length;
    const expiringDocsCount = all.filter((s) => s.documentStatus === 'Vencendo').length;
    const activeInErpCount = all.filter((s) => s.erpStatus === 'Concluído' || s.erpStatus === 'Já cadastrado').length;
    const notInErpCount = all.filter((s) => s.erpStatus === 'Não cadastrado' || s.erpStatus === 'Não verificado').length;
    const newSuppliersMonth = all.filter((s) => {
      const created = new Date(s.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return created >= thirtyDaysAgo;
    }).length;

    const categoryMap: Record<string, { count: number; homologated: number }> = {};
    const standardCategories = [
      'Tecnologia',
      'Facilities',
      'Logística',
      'Marketing',
      'Jurídico',
      'Serviços profissionais',
      'Produtos operacionais',
      'Obras e manutenção',
    ];

    standardCategories.forEach((cat) => {
      categoryMap[cat] = { count: 0, homologated: 0 };
    });

    all.forEach((s) => {
      (s.categories || []).forEach((cat) => {
        if (!categoryMap[cat]) {
          categoryMap[cat] = { count: 0, homologated: 0 };
        }
        categoryMap[cat].count++;
        if (s.status === 'Homologado') {
          categoryMap[cat].homologated++;
        }
      });
    });

    const coverageByCategory = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      count: data.count,
      homologated: data.homologated,
    }));

    const lowCoverageCategories = coverageByCategory
      .filter((c) => c.homologated === 0 || c.count <= 1)
      .map((c) => c.category);

    const regionMap: Record<string, number> = {};
    all.forEach((s) => {
      (s.regions || []).forEach((r) => {
        regionMap[r] = (regionMap[r] || 0) + 1;
      });
    });

    const coverageByRegion = Object.entries(regionMap).map(([region, count]) => ({
      region,
      count,
    }));

    const unitMap: Record<string, number> = {};
    all.forEach((s) => {
      (s.businessUnits || []).forEach((u) => {
        unitMap[u] = (unitMap[u] || 0) + 1;
      });
    });

    const coverageByUnit = Object.entries(unitMap).map(([unit, count]) => ({
      unit,
      count,
    }));

    return {
      totalSuppliers,
      homologatedCount,
      completeCount,
      pendingCount,
      expiredDocsCount,
      expiringDocsCount,
      activeInErpCount,
      notInErpCount,
      newSuppliersMonth,
      coverageByCategory,
      coverageByRegion,
      coverageByUnit,
      lowCoverageCategories,
    };
  },

  async getErpQueueMetrics(): Promise<ErpQueueMetrics> {
    const all = await this.getAllErpRequests();
    const totalRequests = all.length;
    const pendingCount = all.filter((r) => r.currentStatus === 'Recebido').length;
    const inProgressCount = all.filter((r) => r.currentStatus === 'Em triagem' || r.currentStatus === 'Em cadastro').length;
    const waitingAdjustmentCount = all.filter(
      (r) => r.currentStatus === 'Aguardando informação' || r.currentStatus === 'Aguardando validação'
    ).length;
    const completedCount = all.filter((r) => r.currentStatus === 'Concluído').length;

    const nowStr = new Date().toISOString().split('T')[0];
    const delayedCount = all.filter((r) => r.currentStatus !== 'Concluído' && r.deadline < nowStr).length;
    const onTimeCount = totalRequests - delayedCount;

    return {
      totalRequests,
      pendingCount,
      inProgressCount,
      waitingAdjustmentCount,
      completedCount,
      onTimeCount,
      delayedCount,
    };
  },

  // ==========================================================================
  // GESTÃO DE USUÁRIOS E AUTENTICAÇÃO REAL
  // ==========================================================================
  async getUserByEmail(email: string): Promise<(User & { passwordHash?: string }) | null> {
    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail) return null;

    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
        if (res.rows.length > 0) {
          return rowToUser(res.rows[0]);
        }
      } catch (err: any) {
        console.warn('[DB] Erro ao buscar usuário do Neon:', err.message);
      }
    }

    const localUser = usersStore.find((u) => u.email.toLowerCase() === cleanEmail);
    return localUser || null;
  },

  async createUser(data: {
    email: string;
    name: string;
    role: UserRole;
    companyName?: string;
    password?: string;
  }): Promise<User> {
    const cleanEmail = data.email.trim().toLowerCase();
    const newId = `u-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const plainPwd = data.password || '123456';
    const hashedPwd = bcrypt.hashSync(plainPwd, 10);

    const newUser: User & { passwordHash?: string } = {
      id: newId,
      email: cleanEmail,
      name: data.name.trim(),
      role: data.role,
      companyName: data.companyName?.trim() || undefined,
      passwordHash: hashedPwd,
    };

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO users (id, email, name, role, company_name, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (email) DO UPDATE 
           SET name = EXCLUDED.name, role = EXCLUDED.role, company_name = EXCLUDED.company_name, password_hash = EXCLUDED.password_hash`,
          [newUser.id, newUser.email, newUser.name, newUser.role, newUser.companyName || null, hashedPwd]
        );
      } catch (err: any) {
        console.warn('[DB] Erro ao salvar usuário no Neon:', err.message);
      }
    }

    const existingIdx = usersStore.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (existingIdx >= 0) {
      usersStore[existingIdx] = newUser;
    } else {
      usersStore.push(newUser);
    }

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      companyName: newUser.companyName,
    };
  },

  async authenticateUser(email: string, password = '123456'): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    if (user.passwordHash) {
      const isBcrypt = user.passwordHash.startsWith('$2a$') || 
                       user.passwordHash.startsWith('$2b$') || 
                       user.passwordHash.startsWith('$2y$');

      if (isBcrypt) {
        const isMatch = bcrypt.compareSync(password, user.passwordHash);
        if (!isMatch) return null;
      } else {
        // Compatibilidade total com senhas legadas em texto puro
        if (user.passwordHash !== password) {
          return null;
        }
        // Migração automática e transparente para hash seguro no banco
        try {
          const upgradedHash = bcrypt.hashSync(password, 10);
          user.passwordHash = upgradedHash;
          const pool = getPool();
          if (pool) {
            await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [upgradedHash, user.id]);
          }
        } catch (e: any) {
          console.warn('[AUTH] Falha ao migrar senha legada para hash:', e.message);
        }
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyName: user.companyName,
    };
  },

  async getAllUsers(): Promise<User[]> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT id, email, name, role, company_name, created_at FROM users ORDER BY created_at ASC');
        return res.rows.map(rowToUser);
      } catch (err: any) {
        console.warn('[DB] Erro ao listar usuários do Neon:', err.message);
      }
    }

    return usersStore.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      companyName: u.companyName,
    }));
  },

  // Limpeza total de dados transacionais para teste do zero
  async wipeCleanDatabase(): Promise<void> {
    const pool = getPool();
    if (pool) {
      try {
        await pool.query(`
          TRUNCATE TABLE notifications CASCADE;
          TRUNCATE TABLE supplier_status_history CASCADE;
          TRUNCATE TABLE erp_requests CASCADE;
          TRUNCATE TABLE sourcing_awards CASCADE;
          TRUNCATE TABLE suppliers CASCADE;
          TRUNCATE TABLE users CASCADE;
        `);
      } catch (err: any) {
        console.error('[DB] Erro ao limpar Neon PostgreSQL:', err.message);
      }
    }

    usersStore = [];
    suppliersStore = [];
    awardsStore = [];
    erpRequestsStore = [];
    historyStore = [];
    notificationsStore = [];
  },

  // Reset para estado inicial limpo
  async resetDemoData(): Promise<void> {
    await this.wipeCleanDatabase();
  },
};
