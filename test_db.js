require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as val');
    console.log('DB SUCCESS:', res.rows[0]);
  } catch (err) {
    console.error('DB ERROR:', err);
  } finally {
    await client.end();
  }
}
testConnection();
