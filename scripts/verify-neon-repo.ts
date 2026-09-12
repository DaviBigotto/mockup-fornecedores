import dotenv from 'dotenv';
dotenv.config();

import { repository } from '../server/db/repository.js';
import { checkDbConnection, getPool } from '../server/db/client.js';

async function testRepository() {
  console.log('🧪 Verificando conexão e operações do repositório com Neon PostgreSQL...');
  
  const dbStatus = await checkDbConnection();
  console.log('Status da Conexão:', dbStatus);
  
  if (!dbStatus.connected) {
    console.error('❌ Falha na conexão com Neon!');
    process.exit(1);
  }

  // 1. Listar Fornecedores
  const suppliers = await repository.getAllSuppliers();
  console.log(`✅ Fornecedores retornados do Neon: ${suppliers.length}`);
  suppliers.slice(0, 5).forEach((s, idx) => {
    console.log(`   ${idx + 1}. [${s.id}] ${s.tradeName} | CNPJ: ${s.cnpj} | Status: ${s.status} | ERP: ${s.erpStatus}`);
  });

  // 2. Listar Premiações
  const awards = await repository.getAllAwards();
  console.log(`\n✅ Premiações de Sourcing no Neon: ${awards.length}`);
  awards.forEach((a) => {
    console.log(`   - [${a.id}] ${a.sourcingProcessCode} -> ${a.supplierName} (R$ ${a.contractValue.toLocaleString('pt-BR')}) | Caminho: ${a.decisionFlow?.pathCode || 'N/A'}`);
  });

  // 3. Listar Fila ERP
  const erpReqs = await repository.getAllErpRequests();
  console.log(`\n✅ Solicitações na Fila ERP no Neon: ${erpReqs.length}`);
  erpReqs.forEach((r) => {
    console.log(`   - [${r.requestCode}] ${r.supplierName} | Status: ${r.currentStatus} | SLA: ${r.deadline} | Analista: ${r.assignedAnalyst}`);
  });

  // 4. Teste de Métricas
  const procMetrics = await repository.getProcurementMetrics();
  console.log('\n✅ Métricas de Compras calculadas:', {
    total: procMetrics.totalSuppliers,
    homologados: procMetrics.homologatedCount,
    ativosErp: procMetrics.activeInErpCount,
    pendentes: procMetrics.pendingCount,
  });

  const erpMetrics = await repository.getErpQueueMetrics();
  console.log('✅ Métricas da Fila ERP calculadas:', erpMetrics);

  const pool = getPool();
  if (pool) await pool.end();
  console.log('\n🎉 Todos os testes de repositório e banco Neon passaram com 100% de sucesso!');
  process.exit(0);
}

testRepository().catch((err) => {
  console.error('❌ Erro no teste:', err);
  process.exit(1);
});
