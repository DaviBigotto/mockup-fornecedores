import dotenv from 'dotenv';
dotenv.config();

import { repository } from '../server/db/repository.js';
import { checkDbConnection, getPool } from '../server/db/client.js';

async function testIntegration() {
  console.log('--- TESTANDO CONEXÃO COM O BANCO ---');
  const status = await checkDbConnection();
  console.log('Status conexão:', status);

  if (!status.connected) {
    console.error('❌ Falha na conexão com o banco!');
    process.exit(1);
  }

  console.log('\n--- 1. TESTANDO CRIAÇÃO DE USUÁRIO ---');
  try {
    const user = await repository.createUser({
      name: 'Gestor Teste',
      email: 'gestor@teste.com',
      password: '123',
      role: 'fornecedor',
      companyName: 'Empresa Teste Ltda',
    });
    console.log('✅ Usuário criado:', user);
  } catch (err: any) {
    console.error('❌ Erro ao criar usuário:', err);
  }

  console.log('\n--- 2. TESTANDO CRIAÇÃO DE FORNECEDOR (PRÉ-CADASTRO) ---');
  let createdSupplier: any;
  try {
    createdSupplier = await repository.createSupplier({
      cnpj: '12.345.678/0001-90',
      corporateName: 'Fornecedor Real Teste Ltda',
      tradeName: 'Fornecedor Real',
      openingDate: '', // test empty date string
      contacts: [
        {
          id: 'c-1',
          name: 'Gestor Teste',
          role: 'Representante',
          email: 'gestor@teste.com',
          phone: '(11) 99999-9999',
          isPrimary: true,
        },
      ],
    });
    console.log('✅ Fornecedor criado:', createdSupplier.id, createdSupplier.corporateName);
  } catch (err: any) {
    console.error('❌ Erro ao criar fornecedor:', err);
  }

  console.log('\n--- 3. TESTANDO ATUALIZAÇÃO DE FORNECEDOR (WIZARD ETAPAS) ---');
  try {
    const updated = await repository.updateSupplier(
      createdSupplier.id,
      {
        corporateName: 'Fornecedor Real Teste Ltda - Atualizado',
        mainCategory: 'Tecnologia',
        categories: ['Tecnologia', 'Facilities'],
        openingDate: '', // empty date
        status: 'Enviado',
        completionPercentage: 100,
        currentStep: 8,
      },
      'Gestor Teste'
    );
    console.log('✅ Fornecedor atualizado:', updated?.id, updated?.status);
  } catch (err: any) {
    console.error('❌ Erro ao atualizar fornecedor:', err);
  }

  console.log('\n--- 4. TESTANDO BUSCA DE FORNECEDORES NO BANCO ---');
  const pool = getPool();
  if (pool) {
    const dbRes = await pool.query('SELECT id, cnpj, corporate_name, status, categories, contacts FROM suppliers');
    console.log(`✅ Fornecedores persistidos diretamente no Postgres (${dbRes.rows.length}):`);
    console.log(dbRes.rows);

    const userRes = await pool.query('SELECT id, email, name, role FROM users');
    console.log(`✅ Usuários persistidos no Postgres (${userRes.rows.length}):`);
    console.log(userRes.rows);
  }

  console.log('\n--- FIM DOS TESTES ---');
  process.exit(0);
}

testIntegration().catch((e) => {
  console.error('Erro geral:', e);
  process.exit(1);
});
