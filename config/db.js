const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('../db/schema');

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
}

// Auto-convert Supabase direct URL (IPv6-only) to transaction-mode pooler URL (IPv4)
// Direct:  postgresql://postgres:{pass}@db.{ref}.supabase.co:5432/postgres
// Pooler:  postgresql://postgres.{ref}:{pass}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
function resolveDbUrl(url) {
  const match = url.match(/^(postgresql|postgres):\/\/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co:5432\/(.+)$/);
  if (match) {
    const [, , password, ref, dbname] = match;
    const poolerUrl = `postgresql://postgres.${ref}:${password}@aws-1-ap-northeast-1.pooler.supabase.com:6543/${dbname}`;
    console.log('ℹ️  Converted Supabase direct URL to IPv4 pooler URL');
    return poolerUrl;
  }
  return url;
}

const connectionString = resolveDbUrl(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString,
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
