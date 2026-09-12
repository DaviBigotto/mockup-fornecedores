import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function runSchema() {
  console.log('🚀 Executando DDL Schema no Neon PostgreSQL...');
  const schemaPath = path.resolve(__dirname, '../server/db/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Esquema DDL executado com sucesso no Neon!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao executar o DDL:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSchema();
