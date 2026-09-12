// ==============================================================================
// SCRIPT DE LIMPEZA TOTAL DO BANCO NEON POSTGRESQL - PLURIX ORGANIZER
// Remove todos os dados transacionais e perfis fictícios, mantendo as tabelas base
// ==============================================================================

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

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

export async function cleanAllDatabase(targetPool: pg.Pool = pool) {
  const client = await targetPool.connect();
  try {
    console.log('🧹 Limpando todos os dados transacionais e perfis do Neon PostgreSQL...');
    await client.query('BEGIN');

    // 1. Limpar todas as tabelas transacionais e usuários de demo
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

    // 2. Inserir Categorias Oficiais Plurix
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

    // 3. Inserir Unidades de Negócio Plurix
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

    // 4. Inserir Tipos de Documentos Obrigatórios
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

    await client.query('COMMIT');
    console.log(`✅ Banco Neon completamente limpo! Todos os fornecedores, premiações e contas demo foram removidos.`);
    console.log(`✨ Sistema pronto do zero para cadastros e testes reais.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao limpar o banco:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('clean-db.ts')) {
  cleanAllDatabase(pool)
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
