const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('../db/schema');

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

console.log('✅ Neon DB (PostgreSQL) connected via Drizzle ORM');

module.exports = db;
