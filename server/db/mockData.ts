// ==============================================================================
// BASE DE DADOS INICIAL - PLURIX ORGANIZER
// Estrutura limpa para preenchimento de ponta a ponta a partir dos cadastros reais
// ==============================================================================

import {
  Supplier,
  SourcingAward,
  ErpRequest,
  StatusHistoryEvent,
  NotificationItem,
  User,
} from '../../src/types/index.js';

export const DEMO_USERS: User[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_AWARDS: SourcingAward[] = [];

export const INITIAL_ERP_REQUESTS: ErpRequest[] = [];

export const INITIAL_HISTORY: StatusHistoryEvent[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
