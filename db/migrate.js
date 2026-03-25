#!/usr/bin/env node
/**
 * Database Migration Script
 * Creates/updates the database schema using Drizzle
 */

require('dotenv').config();
const { execSync } = require('child_process');

console.log('🔄 Running database migrations...');

try {
    // Use drizzle-kit to push schema to database
    execSync('drizzle-kit push --config drizzle.config.js', { stdio: 'inherit' });
    console.log('✅ Database schema created successfully');
    process.exit(0);
} catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
}
