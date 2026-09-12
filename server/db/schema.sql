-- ==============================================================================
-- PLURIX ORGANIZER - MÓDULO DE GESTÃO, HOMOLOGAÇÃO E CADASTRO DE FORNECEDORES
-- DDL DE CRIAÇÃO DO ESQUEMA NO NEON POSTGRESQL
-- ==============================================================================

-- 1. Empresas do Grupo Plurix / Unidades
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    cnpj VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuários do Sistema (Perfis da Demonstração)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'fornecedor', 'compras', 'cadastro'
    company_name VARCHAR(255),
    password_hash VARCHAR(255) DEFAULT '123456',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categorias de Fornecimento
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Unidades de Negócio / Bandeiras Plurix
CREATE TABLE IF NOT EXISTS business_units (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    region VARCHAR(50) NOT NULL, -- 'Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'
    state_uf VARCHAR(2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tipos de Documentos
CREATE TABLE IF NOT EXISTS document_types (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Cadastro Principal de Fornecedores (com atributos completos e JSONB para estruturas aninhadas)
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    corporate_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    legal_nature VARCHAR(100),
    state_registration VARCHAR(50),
    municipal_registration VARCHAR(50),
    main_cnae VARCHAR(100),
    opening_date DATE,
    company_size VARCHAR(50),
    
    -- Dados Fiscais / Tributários
    tax_regime VARCHAR(100),
    simples_nacional BOOLEAN DEFAULT false,
    ibs_cbs_regime VARCHAR(100),
    ibs_cbs_contributor BOOLEAN DEFAULT true,
    tax_classification VARCHAR(100),
    
    -- Atuação e Cobertura
    main_category VARCHAR(100) NOT NULL,
    categories JSONB DEFAULT '[]'::jsonb,
    subcategories JSONB DEFAULT '[]'::jsonb,
    products_services TEXT,
    regions JSONB DEFAULT '[]'::jsonb,
    states JSONB DEFAULT '[]'::jsonb,
    business_units JSONB DEFAULT '[]'::jsonb,
    service_capacity TEXT,
    market_experience_years INT DEFAULT 0,
    estimated_employees INT DEFAULT 0,
    
    -- Status Independentes (Regra Central de Negócio)
    status VARCHAR(50) NOT NULL DEFAULT 'Pré-cadastro',
    erp_status VARCHAR(50) NOT NULL DEFAULT 'Não cadastrado',
    document_status VARCHAR(50) NOT NULL DEFAULT 'Não enviado',
    erp_code VARCHAR(50),
    
    -- Wizard e Progresso
    completion_percentage INT DEFAULT 15,
    current_step INT DEFAULT 1,
    draft_data JSONB DEFAULT '{}'::jsonb,
    
    -- Estruturas Relacionais em JSONB para Alta Performance
    contacts JSONB DEFAULT '[]'::jsonb,
    address JSONB DEFAULT '{}'::jsonb,
    bank_accounts JSONB DEFAULT '[]'::jsonb,
    shareholders JSONB DEFAULT '[]'::jsonb,
    commercial_references JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    pending_items JSONB DEFAULT '[]'::jsonb,
    
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers(cnpj);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_erp_status ON suppliers(erp_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_doc_status ON suppliers(document_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_main_cat ON suppliers(main_category);

-- 7. Registro de Fornecedor Premiado em Sourcing (Organizer)
CREATE TABLE IF NOT EXISTS sourcing_awards (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_cnpj VARCHAR(20) NOT NULL,
    sourcing_process_code VARCHAR(100) NOT NULL,
    business_unit VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    contract_value NUMERIC(15,2) NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    has_erp_registration BOOLEAN DEFAULT false,
    erp_code VARCHAR(50),
    needs_contract BOOLEAN DEFAULT false,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Em andamento',
    decision_flow JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_awards_supplier_id ON sourcing_awards(supplier_id);
CREATE INDEX IF NOT EXISTS idx_awards_status ON sourcing_awards(status);

-- 8. Fila de Solicitações do Time de Cadastro / ERP
CREATE TABLE IF NOT EXISTS erp_requests (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_cnpj VARCHAR(20) NOT NULL,
    award_id TEXT REFERENCES sourcing_awards(id) ON DELETE SET NULL,
    request_code VARCHAR(50) UNIQUE NOT NULL,
    requesting_unit VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    current_status VARCHAR(50) NOT NULL DEFAULT 'Recebido',
    determined_flow VARCHAR(50) NOT NULL,
    deadline DATE NOT NULL,
    assigned_analyst VARCHAR(255),
    erp_supplier_code VARCHAR(50),
    has_existing_erp BOOLEAN DEFAULT false,
    contract_value NUMERIC(15,2),
    notes TEXT,
    next_step VARCHAR(255),
    start_date DATE,
    completion_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_req_supplier_id ON erp_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_erp_req_status ON erp_requests(current_status);
CREATE INDEX IF NOT EXISTS idx_erp_req_code ON erp_requests(request_code);

-- 9. Histórico e Trilha de Auditoria do Fornecedor
CREATE TABLE IF NOT EXISTS supplier_status_history (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    profile VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    previous_status VARCHAR(100),
    new_status VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_supplier_id ON supplier_status_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON supplier_status_history(created_at DESC);

-- 10. Notificações do Sistema
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    target_profile VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(255),
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_target ON notifications(target_profile);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read);
