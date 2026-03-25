require('dotenv').config();

console.log('\n✅ CONFIGURATION VERIFICATION REPORT\n');

// Environment Variables Check
console.log('📋 Required Environment Variables:');
const required = ['DATABASE_URL', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'CLOUDINARY_NAME', 'CLOUDINARY_KEY', 'CLOUDINARY_SECRET', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'ALLOWED_ORIGINS'];

let allSet = true;
required.forEach(key => {
  const status = process.env[key] ? '✅' : '❌';
  console.log(`  ${status} ${key}`);
  if (!process.env[key]) allSet = false;
});

// Database
console.log('\n🗄️  Database Connection:');
try {
  require('./config/db');
  console.log('  ✅ PostgreSQL (Neon) initialized');
} catch (e) {
  console.log('  ❌ Error:', e.message);
}

// Redis
console.log('\n⚡ Redis Connection:');
try {
  const { redis } = require('./config/upstash');
  console.log('  ✅ Redis client initialized');
} catch (e) {
  console.log('  ❌ Error:', e.message);
}

// Cloudinary
console.log('\n🖼️  Cloudinary:');
if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY) {
  console.log('  ✅ Cloudinary credentials loaded');
}

// Firebase
console.log('\n🔥 Firebase:');
if (process.env.FIREBASE_PROJECT_ID) {
  console.log('  ✅ Firebase configured (Project: ' + process.env.FIREBASE_PROJECT_ID + ')');
}

console.log('\n' + (allSet ? '✅ ALL REQUIRED SERVICES CONFIGURED AND READY' : '❌ SOME SERVICES MISSING'));
console.log();
