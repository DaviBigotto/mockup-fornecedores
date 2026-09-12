// ==============================================================================
// EXPRESS APP & ROTAS DE API - PLURIX ORGANIZER
// ==============================================================================

import express from 'express';
import cors from 'cors';
import { checkDbConnection } from './db/client.js';
import { repository } from './db/repository.js';

export function createExpressApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --------------------------------------------------------------------------
  // ROTAS DE API
  // --------------------------------------------------------------------------

  // Status do Sistema e Conexão Neon
  app.get('/api/status', async (req, res) => {
    const dbStatus = await checkDbConnection();
    res.json({
      system: 'Plurix Organizer - Módulo de Gestão de Fornecedores',
      version: '1.0.0',
      database: dbStatus,
    });
  });

  // --------------------------------------------------------------------------
  // AUTENTICAÇÃO E GESTÃO DE USUÁRIOS
  // --------------------------------------------------------------------------

  // Registro de Novo Usuário (Fornecedor, Compras ou Cadastro ERP)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, role, companyName } = req.body;
      if (!email || !name || !role) {
        return res.status(400).json({ error: 'Nome, e-mail e perfil são obrigatórios.' });
      }

      const existing = await repository.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema. Faça login para continuar.' });
      }

      const user = await repository.createUser({
        name,
        email,
        password: password || '123456',
        role,
        companyName: companyName || (role === 'compras' ? 'Plurix Compras Corporativas' : role === 'cadastro' ? 'Plurix Governança & ERP' : 'Empresa Parceira'),
      });

      res.status(201).json({
        user,
        token: `token-${user.id}`,
        message: 'Usuário cadastrado com sucesso!',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Login de Usuário
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, role } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
      }

      let user = await repository.authenticateUser(email, password || '123456');

      if (!user) {
        const existingUser = await repository.getUserByEmail(email);
        if (existingUser) {
          return res.status(401).json({ error: 'Senha incorreta. Verifique suas credenciais.' });
        }

        // Se o usuário ainda não existe, cria a conta dinamicamente para o perfil selecionado
        const derivedName = email.split('@')[0].replace(/[._]/g, ' ');
        const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
        const userRole = role || 'fornecedor';

        user = await repository.createUser({
          name: formattedName,
          email,
          password: password || '123456',
          role: userRole,
          companyName: userRole === 'compras' ? 'Plurix Compras' : userRole === 'cadastro' ? 'Plurix Governança ERP' : 'Empresa Parceira',
        });
      }

      res.json({
        user,
        token: `token-${user.id}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Listar Usuários
  app.get('/api/auth/users', async (req, res) => {
    try {
      const users = await repository.getAllUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // FORNECEDORES
  // --------------------------------------------------------------------------
  app.get('/api/suppliers', async (req, res) => {
    try {
      const { search, category, status, erpStatus, region, businessUnit, documentStatus } = req.query;
      let list = await repository.getAllSuppliers();

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        list = list.filter(
          (s) =>
            s.corporateName.toLowerCase().includes(q) ||
            s.tradeName.toLowerCase().includes(q) ||
            s.cnpj.includes(q) ||
            (s.erpCode && s.erpCode.toLowerCase().includes(q))
        );
      }

      if (category && typeof category === 'string' && category !== 'Todas') {
        list = list.filter((s) => s.categories && s.categories.includes(category));
      }

      if (status && typeof status === 'string' && status !== 'Todos') {
        list = list.filter((s) => s.status === status);
      }

      if (erpStatus && typeof erpStatus === 'string' && erpStatus !== 'Todos') {
        list = list.filter((s) => s.erpStatus === erpStatus);
      }

      if (region && typeof region === 'string' && region !== 'Todas') {
        list = list.filter((s) => s.regions && s.regions.includes(region));
      }

      if (businessUnit && typeof businessUnit === 'string' && businessUnit !== 'Todas') {
        list = list.filter((s) => s.businessUnits && s.businessUnits.includes(businessUnit));
      }

      if (documentStatus && typeof documentStatus === 'string' && documentStatus !== 'Todos') {
        list = list.filter((s) => s.documentStatus === documentStatus);
      }

      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/suppliers/:id', async (req, res) => {
    try {
      const supplier = await repository.getSupplierById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }
      res.json(supplier);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/suppliers', async (req, res) => {
    try {
      const created = await repository.createSupplier(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/suppliers/:id', async (req, res) => {
    try {
      const actor = (req.headers['x-user-name'] as string) || 'Usuário do Sistema';
      const updated = await repository.updateSupplier(req.params.id, req.body, actor);
      if (!updated) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/suppliers/:id/documents', async (req, res) => {
    try {
      const { id } = req.params;
      const { documentTypeCode, documentName, fileName, issueDate, expirationDate } = req.body;
      const supplier = await repository.getSupplierById(id);
      if (!supplier) return res.status(404).json({ error: 'Fornecedor não encontrado' });

      const docs = supplier.documents || [];
      const existingIndex = docs.findIndex((d) => d.documentTypeCode === documentTypeCode);

      const newDoc = {
        id: `doc-${Date.now()}`,
        supplierId: id,
        documentTypeCode,
        documentName: documentName || 'Documento Anexo',
        fileName: fileName || 'documento_enviado.pdf',
        fileSizeBytes: Math.floor(Math.random() * 800000) + 200000,
        issueDate: issueDate || new Date().toISOString().split('T')[0],
        expirationDate: expirationDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Em validação' as const,
        isMandatory: true,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        docs[existingIndex] = newDoc;
      } else {
        docs.push(newDoc);
      }

      await repository.updateSupplier(id, { documents: docs, documentStatus: 'Em validação' }, 'Fornecedor');
      await repository.addHistoryEvent({
        supplierId: id,
        eventType: 'DOCUMENTO_ENVIADO',
        profile: 'Fornecedor',
        userName: (req.headers['x-user-name'] as string) || 'Fornecedor',
        action: 'Documento Anexado',
        description: `Documento ${newDoc.documentName} (${newDoc.fileName}) enviado para análise.`,
      });

      res.json(newDoc);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/suppliers/:id/history', async (req, res) => {
    try {
      const history = await repository.getHistoryBySupplierId(req.params.id);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/history', async (req, res) => {
    try {
      const history = await repository.getAllHistoryEvents();
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // MÉTRICAS CALCULADAS
  // --------------------------------------------------------------------------
  app.get('/api/metrics/procurement', async (req, res) => {
    try {
      const metrics = await repository.getProcurementMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/metrics/erp', async (req, res) => {
    try {
      const metrics = await repository.getErpQueueMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // SOURCING AWARDS & MATRIZ DE DECISÃO
  // --------------------------------------------------------------------------
  app.get('/api/awards', async (req, res) => {
    try {
      const list = await repository.getAllAwards();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/awards', async (req, res) => {
    try {
      const award = await repository.createAward(req.body);
      res.status(201).json(award);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/awards/:id/steps/:stepIndex', async (req, res) => {
    try {
      const { status, notes } = req.body;
      const updated = await repository.updateAwardStepStatus(
        req.params.id,
        parseInt(req.params.stepIndex, 10),
        status,
        notes
      );
      if (!updated) return res.status(404).json({ error: 'Etapa ou premiação não localizada' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // FILA OPERACIONAL TIME DE CADASTRO / ERP
  // --------------------------------------------------------------------------
  app.get('/api/erp-requests', async (req, res) => {
    try {
      const list = await repository.getAllErpRequests();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/erp-requests/:id', async (req, res) => {
    try {
      const item = await repository.getErpRequestById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Solicitação não encontrada' });
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/erp-requests/:id', async (req, res) => {
    try {
      const updated = await repository.updateErpRequestStatus(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Solicitação não encontrada' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // NOTIFICAÇÕES
  // --------------------------------------------------------------------------
  app.get('/api/notifications', async (req, res) => {
    try {
      const profile = req.query.profile as string;
      const list = await repository.getNotifications(profile);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/notifications/:id/read', async (req, res) => {
    try {
      await repository.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // LIMPEZA E MANUTENÇÃO
  // --------------------------------------------------------------------------
  app.post('/api/wipe-clean', async (req, res) => {
    try {
      await repository.wipeCleanDatabase();
      res.json({ success: true, message: 'Banco de dados completamente zerado para teste do zero.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reset-demo', async (req, res) => {
    try {
      await repository.resetDemoData();
      res.json({ success: true, message: 'Dados restaurados com sucesso.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}

export const app = createExpressApp();
