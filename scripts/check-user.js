require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query("SELECT id, email, role, password_hash FROM users WHERE email='bala@pondiuni.ac.in'")
  .then(async (r) => {
    if (!r.rows.length) { console.log('User NOT found'); pool.end(); return; }
    const u = r.rows[0];
    console.log('User found:', u.email, '| role:', u.role);
    const ok = await bcrypt.compare('Mahesh0786**', u.password_hash);
    console.log('Password match:', ok);
    pool.end();
  })
  .catch((e) => { console.error(e.message); pool.end(); });
