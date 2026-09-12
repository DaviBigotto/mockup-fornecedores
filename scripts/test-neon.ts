import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error('ERRO: DATABASE_URL não definida no .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  console.log('Conectando ao Neon PostgreSQL...');
  const client = await pool.connect();
  console.log('✅ Conexão estabelecida com sucesso!');
  
  const res = await client.query('SELECT NOW() as current_time, version();');
  console.log('Hora no servidor:', res.rows[0].current_time);
  console.log('Versão PostgreSQL:', res.rows[0].version);

  client.release();
  await pool.end();
}

main().catch((err) => {
  console.error('Erro na conexão:', err);
  process.exit(1);
});
