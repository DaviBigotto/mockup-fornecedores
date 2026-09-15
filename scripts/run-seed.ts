import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { DEMO_USERS } from '../server/db/mockData.js';

dotenv.config();

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error('❌ ERRO: DATABASE_URL não definida no .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function seedCleanDatabase(targetPool: pg.Pool = pool) {
  const client = await targetPool.connect();
  try {
    console.log('🧹 Limpando dados do Neon PostgreSQL e mantendo apenas estrutura base e logins...');
    await client.query('BEGIN');

    // 1. Limpar todas as tabelas transacionais
    await client.query(`
      TRUNCATE TABLE notifications CASCADE;
      TRUNCATE TABLE supplier_status_history CASCADE;
      TRUNCATE TABLE erp_requests CASCADE;
      TRUNCATE TABLE sourcing_awards CASCADE;
      TRUNCATE TABLE suppliers CASCADE;
      TRUNCATE TABLE users CASCADE;
      TRUNCATE TABLE business_units CASCADE;
      TRUNCATE TABLE categories CASCADE;
      TRUNCATE TABLE document_types CASCADE;
    `);

    // 2. Categorias Oficiais Plurix
    const categories = [
      ['cat-01', 'Tecnologia', 'Sistemas em nuvem, telecomunicações, equipamentos de TI e automação'],
      ['cat-02', 'Facilities', 'Limpeza técnica, portaria, recepção e vigilância patrimonial'],
      ['cat-03', 'Logística', 'Transporte frigorificado, armazenagem, carga seca e cross-docking'],
      ['cat-04', 'Marketing', 'Comunicação visual, eventos, agências e material promocional de PDV'],
      ['cat-05', 'Jurídico', 'Serviços advocatícios, consultoria legal e auditoria corporativa'],
      ['cat-06', 'Serviços profissionais', 'Consultoria de gestão, auditoria contábil e treinamentos'],
      ['cat-07', 'Produtos operacionais', 'Embalagens, uniformes, EPIs, hortifruti e suprimentos de loja'],
      ['cat-08', 'Obras e manutenção', 'Engenharia civil, reformas de lojas, climatização (PMOC) e elétrica'],
    ];

    for (const [id, name, desc] of categories) {
      await client.query(
        `INSERT INTO categories (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
        [id, name, desc]
      );
    }

    // 3. Unidades de Negócio Plurix
    const businessUnits = [
      ['bu-01', 'CD-ARUJA', 'CD Central Arujá', 'Sudeste', 'SP'],
      ['bu-02', 'CD-RIB', 'CD Regional Ribeirão Preto', 'Sudeste', 'SP'],
      ['bu-03', 'CORP-SP', 'Unidade Corporativa SP', 'Sudeste', 'SP'],
      ['bu-04', 'BAN-SUL', 'Bandeira Super Sul', 'Sul', 'PR'],
      ['bu-05', 'BAN-MVC', 'Bandeira Mais Você', 'Sudeste', 'SP'],
      ['bu-06', 'HIP-CAMP', 'Hiper Plurix Campinas', 'Sudeste', 'SP'],
    ];

    for (const [id, code, name, region, uf] of businessUnits) {
      await client.query(
        `INSERT INTO business_units (id, code, name, region, state_uf) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO NOTHING`,
        [id, code, name, region, uf]
      );
    }

    // 4. Usuários Oficiais de Demonstração (3 Perfis)
    const demoUsers = [
      {
        id: 'u-fornecedor',
        email: 'fornecedor@demo.com',
        name: 'Carlos Mendes',
        role: 'fornecedor',
        companyName: 'TechCloud Soluções de TI Ltda.',
      },
      {
        id: 'u-compras',
        email: 'compras@plurix.com',
        name: 'Mariana Esteves',
        role: 'compras',
        companyName: 'Plurix Compras Corporativas',
      },
      {
        id: 'u-cadastro',
        email: 'cadastro@plurix.com',
        name: 'Roberto Valente',
        role: 'cadastro',
        companyName: 'Plurix Governança & Cadastro ERP',
      },
    ];

    const defaultHash = bcrypt.hashSync('123456', 10);
    for (const u of demoUsers) {
      await client.query(
        `INSERT INTO users (id, email, name, role, company_name, password_hash) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
        [u.id, u.email, u.name, u.role, u.companyName, defaultHash]
      );
    }

    // 5. Tipos de Documentos Obrigatórios
    const docTypes = [
      ['dt-01', 'CONTRATO_SOCIAL', 'Contrato Social Consolidado', 'Última alteração contratual consolidada', true],
      ['dt-02', 'CARTAO_CNPJ', 'Cartão CNPJ', 'Comprovante de inscrição e de situação cadastral', true],
      ['dt-03', 'CND_FEDERAL', 'CND Federal e Previdenciária', 'Certidão Conjunta de Débitos Federais (RFB/PGFN)', true],
      ['dt-04', 'CND_ESTADUAL', 'CND Estadual', 'Certidão de Regularidade Fiscal da Fazenda Estadual', true],
      ['dt-05', 'CND_MUNICIPAL', 'CND Municipal', 'Certidão de Tributos Mobiliários do Município', true],
      ['dt-06', 'CND_TRABALHISTA', 'CND Trabalhista (CNDT)', 'Certidão Negativa de Débitos Trabalhistas (TST)', true],
      ['dt-07', 'ALVARA', 'Alvará de Funcionamento / Sanitário', 'Licença da Prefeitura ou Vigilância Sanitária', true],
      ['dt-08', 'COMPROVANTE_BANCARIO', 'Comprovante de Domicílio Bancário', 'Extrato ou carta bancária confirmando titularidade', true],
    ];

    for (const [id, code, name, desc, mandatory] of docTypes) {
      await client.query(
        `INSERT INTO document_types (id, code, name, description, is_mandatory) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO NOTHING`,
        [id, code, name, desc, mandatory]
      );
    }

    // 6. Fornecedor Inicial em Pré-cadastro (Vinculado ao login de fornecedor@demo.com)
    const initialSupplier = {
      id: 'sup-01',
      cnpj: '28.394.102/0001-45',
      corporateName: 'TechCloud Soluções de Tecnologia Ltda.',
      tradeName: 'TechCloud TI',
      legalNature: '206-2 - Sociedade Empresária Limitada',
      stateRegistration: '109.845.231.110',
      municipalRegistration: '9.481.023-4',
      mainCnae: '62.01-5-01 - Desenvolvimento de programas de computador sob encomenda',
      openingDate: '2016-04-12',
      companySize: 'Médio Porte',
      taxRegime: 'Lucro Presumido',
      simplesNacional: false,
      ibsCbsRegime: 'Não Cumulativo Pleno',
      ibsCbsContributor: true,
      taxClassification: 'Serviços de Tecnologia da Informação',
      mainCategory: 'Tecnologia',
      categories: ['Tecnologia'],
      subcategories: ['Infraestrutura Cloud', 'SaaS'],
      productsServices: 'Serviços de computação em nuvem, suporte e integração.',
      regions: ['Sudeste'],
      states: ['SP'],
      businessUnits: ['Unidade Corporativa SP'],
      status: 'Pré-cadastro',
      erpStatus: 'Não cadastrado',
      documentStatus: 'Não enviado',
      completionPercentage: 15,
      currentStep: 1,
      contacts: [
        {
          id: 'c-01',
          name: 'Carlos Mendes',
          role: 'Diretor Comercial',
          email: 'fornecedor@demo.com',
          phone: '(11) 98455-1234',
          isPrimary: true,
        },
      ],
      address: {
        zipCode: '04538-133',
        street: 'Av. Brigadeiro Faria Lima',
        number: '3477',
        complement: 'Torre Norte - Sala 82',
        neighborhood: 'Itaim Bibi',
        city: 'São Paulo',
        state: 'SP',
      },
      bankAccounts: [],
      shareholders: [],
      commercialReferences: [],
      documents: [],
      pendingItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await client.query(
      `INSERT INTO suppliers (
        id, cnpj, corporate_name, trade_name, legal_nature, state_registration, municipal_registration,
        main_cnae, opening_date, company_size, tax_regime, simples_nacional, ibs_cbs_regime, ibs_cbs_contributor,
        tax_classification, main_category, categories, subcategories, products_services, regions, states,
        business_units, status, erp_status, document_status, completion_percentage, current_step,
        contacts, address, bank_accounts, shareholders, commercial_references, documents, pending_items,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17::jsonb, $18::jsonb, $19, $20::jsonb, $21::jsonb, $22::jsonb, $23, $24, $25, $26,
        $27, $28::jsonb, $29::jsonb, $30::jsonb, $31::jsonb, $32::jsonb, $33::jsonb, $34::jsonb,
        $35, $36
      )`,
      [
        initialSupplier.id,
        initialSupplier.cnpj,
        initialSupplier.corporateName,
        initialSupplier.tradeName,
        initialSupplier.legalNature,
        initialSupplier.stateRegistration,
        initialSupplier.municipalRegistration,
        initialSupplier.mainCnae,
        initialSupplier.openingDate,
        initialSupplier.companySize,
        initialSupplier.taxRegime,
        initialSupplier.simplesNacional,
        initialSupplier.ibsCbsRegime,
        initialSupplier.ibsCbsContributor,
        initialSupplier.taxClassification,
        initialSupplier.mainCategory,
        JSON.stringify(initialSupplier.categories),
        JSON.stringify(initialSupplier.subcategories),
        initialSupplier.productsServices,
        JSON.stringify(initialSupplier.regions),
        JSON.stringify(initialSupplier.states),
        JSON.stringify(initialSupplier.businessUnits),
        initialSupplier.status,
        initialSupplier.erpStatus,
        initialSupplier.documentStatus,
        initialSupplier.completionPercentage,
        initialSupplier.currentStep,
        JSON.stringify(initialSupplier.contacts),
        JSON.stringify(initialSupplier.address),
        JSON.stringify(initialSupplier.bankAccounts),
        JSON.stringify(initialSupplier.shareholders),
        JSON.stringify(initialSupplier.commercialReferences),
        JSON.stringify(initialSupplier.documents),
        JSON.stringify(initialSupplier.pendingItems),
        initialSupplier.createdAt,
        initialSupplier.updatedAt,
      ]
    );

    // Histórico inicial do pré-cadastro
    await client.query(
      `INSERT INTO supplier_status_history (
        id, supplier_id, event_type, profile, user_name, action, previous_status, new_status, description, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'hist-01',
        'sup-01',
        'PRE_CADASTRO_REALIZADO',
        'Fornecedor',
        'Carlos Mendes',
        'Pré-cadastro Realizado',
        'Não existente',
        'Pré-cadastro',
        'Conta de acesso criada. Aguardando preenchimento do formulário guiado de homologação.',
        new Date().toISOString(),
      ]
    );

    // Notificação inicial para Compras
    await client.query(
      `INSERT INTO notifications (
        id, target_profile, title, message, link_url, type, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'notif-01',
        'compras',
        'Novo Pré-cadastro Iniciado',
        'TechCloud TI realizou o pré-cadastro e está em preenchimento.',
        '/vendor-list',
        'info',
        false,
        new Date().toISOString(),
      ]
    );

    await client.query('COMMIT');
    console.log(`✅ Banco Neon limpo com sucesso! Apenas 3 logins e 1 fornecedor em pré-cadastro para preenchimento.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao limpar o banco:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('run-seed.ts')) {
  seedCleanDatabase(pool)
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
