// ==============================================================================
// SERVIDOR PRINCIPAL EXPRESS & VITE - PLURIX ORGANIZER
// ==============================================================================

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { checkDbConnection } from './db/client.js';
import { createExpressApp } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

export async function startServer() {
  const app = createExpressApp();

  // Verificação inicial do banco
  try {
    const status = await checkDbConnection();
    if (status.connected) {
      console.log('[DB] Banco Neon PostgreSQL conectado com sucesso.');
    }
  } catch (err: any) {
    console.warn('[DB] Verificação inicial do banco:', err.message);
  }

  // --------------------------------------------------------------------------
  // INTEGRAÇÃO COM VITE (CLIENTE SPA)
  // --------------------------------------------------------------------------
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve(__dirname, '..'),
    });

    app.use(vite.middlewares);
  } else {
    // Servir arquivos de build estáticos
    const distPath = path.resolve(__dirname, '../../dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`\n================================================================`);
    console.log(`🚀 SERVIDOR PLURIX ORGANIZER ATIVO EM: http://localhost:${PORT}`);
    console.log(`📡 Modo de Execução: ${isProd ? 'Produção' : 'Desenvolvimento com Vite'}`);
    console.log(`🏢 Módulo: Gestão, Homologação e Cadastro de Fornecedores`);
    console.log(`💾 Banco de Dados: Neon PostgreSQL Híbrido Ativo`);
    console.log(`================================================================\n`);
  });

  return { app, server };
}

// Execução direta no Node/TSX
startServer().catch((err) => {
  console.error('Erro ao inicializar servidor:', err);
});
