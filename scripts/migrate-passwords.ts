import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

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

async function migratePasswords() {
  const client = await pool.connect();
  try {
    console.log('🔒 Verificando e migrando senhas em texto puro para hash Bcrypt...');
    const res = await client.query('SELECT id, email, password_hash FROM users');
    
    let migratedCount = 0;
    let alreadyHashedCount = 0;

    for (const row of res.rows) {
      const currentPwd = row.password_hash;
      const isBcrypt = currentPwd && (
        currentPwd.startsWith('$2a$') ||
        currentPwd.startsWith('$2b$') ||
        currentPwd.startsWith('$2y$')
      );

      if (isBcrypt) {
        alreadyHashedCount++;
      } else {
        const plainText = currentPwd || '123456';
        const hashed = bcrypt.hashSync(plainText, 10);
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, row.id]);
        console.log(`  ✓ Senha migrada para hash com sucesso: ${row.email}`);
        migratedCount++;
      }
    }

    console.log(`\n🎉 Migração concluída com sucesso!`);
    console.log(`  - Usuários já protegidos com hash: ${alreadyHashedCount}`);
    console.log(`  - Senhas em texto puro convertidas para Bcrypt: ${migratedCount}`);
  } catch (error) {
    console.error('❌ Erro durante a migração de senhas:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migratePasswords();
