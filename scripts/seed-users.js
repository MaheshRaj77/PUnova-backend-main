/**
 * Seed Admin & Faculty credentials
 * Run: node scripts/seed-users.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const USERS = [
  { email: 'bala@pondiuni.ac.in',   full_name: 'Bala Admin',    role: 'admin' },
  { email: 'mahesh@pondiuni.ac.in', full_name: 'Mahesh Faculty', role: 'faculty' },
];

const PASSWORD = 'Mahesh0786**';

async function seed() {
  const client = await pool.connect();
  const password_hash = await bcrypt.hash(PASSWORD, 10);

  try {
    for (const u of USERS) {
      const { rows } = await client.query(
        'SELECT id, role FROM users WHERE email = $1',
        [u.email]
      );

      if (rows.length > 0) {
        await client.query(
          'UPDATE users SET password_hash = $1, role = $2, full_name = $3 WHERE email = $4',
          [password_hash, u.role, u.full_name, u.email]
        );
        console.log(`✅ Updated  [${u.role}]  ${u.email}`);
      } else {
        await client.query(
          `INSERT INTO users (email, password_hash, full_name, role)
           VALUES ($1, $2, $3, $4)`,
          [u.email, password_hash, u.full_name, u.role]
        );
        console.log(`✅ Created  [${u.role}]  ${u.email}`);
      }
    }
    console.log('\nDone. Both accounts are ready.\n');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
