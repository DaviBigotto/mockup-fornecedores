// ==============================================================================
// CLIENTE DE BANCO DE DADOS - NEON POSTGRESQL COM FALLBACK INTELIGENTE
// ==============================================================================

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL?.trim();

export interface DbStatus {
  connected: boolean;
  provider: 'neon' | 'local_fallback';
  message: string;
}

let pool: pg.Pool | null = null;
let isNeonAvailable = false;

if (connectionString && connectionString.startsWith('postgres')) {
  try {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 5000,
    });
  } catch (err: any) {
    console.warn('[DB] Falha ao instanciar pool do Neon:', err.message);
  }
}

export async function checkDbConnection(): Promise<DbStatus> {
  if (!pool) {
    return {
      connected: false,
      provider: 'local_fallback',
      message: 'DATABASE_URL não configurada no .env. Operando em modo de demonstração local de alta fidelidade.',
    };
  }

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    isNeonAvailable = true;
    return {
      connected: true,
      provider: 'neon',
      message: 'Conectado com sucesso ao Neon PostgreSQL.',
    };
  } catch (error: any) {
    isNeonAvailable = false;
    return {
      connected: false,
      provider: 'local_fallback',
      message: `Não foi possível conectar ao Neon (${error.message}). Operando em modo de demonstração local.`,
    };
  }
}

export function getPool(): pg.Pool | null {
  if (!pool) {
    const connStr = process.env.DATABASE_URL?.trim();
    if (connStr && connStr.startsWith('postgres')) {
      try {
        pool = new Pool({
          connectionString: connStr,
          ssl: {
            rejectUnauthorized: false,
          },
          connectionTimeoutMillis: 8000,
        });
      } catch (err: any) {
        console.warn('[DB] Falha ao instanciar pool do Neon:', err.message);
      }
    }
  }
  return pool;
}

export function isNeonConnected() {
  return isNeonAvailable;
}

