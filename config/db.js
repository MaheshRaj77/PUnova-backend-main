const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('../db/schema');

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX) || 10,        // max concurrent connections
  idleTimeoutMillis: 30000,                             // release idle connections after 30s
  connectionTimeoutMillis: 10000,                       // fail fast if can't connect in 10s
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle DB client', err);
});

const db = drizzle(pool, { schema });

console.log('✅ Supabase DB (PostgreSQL) connected via Drizzle ORM');

module.exports = db;
