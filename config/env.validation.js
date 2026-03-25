/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid before app startup
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'CLOUDINARY_NAME',
  'CLOUDINARY_KEY',
  'CLOUDINARY_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'ALLOWED_ORIGINS',
];

const optionalEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM_EMAIL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
];

/**
 * Validate that all required environment variables are set
 * @throws {Error} If any required env var is missing or invalid
 */
function validateEnvironment() {
  const missing = [];
  const invalid = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];

    if (!value) {
      missing.push(envVar);
      continue;
    }

    // Specific validations
    if (envVar === 'DATABASE_URL' && !value.startsWith('postgresql://')) {
      invalid.push(`${envVar}: Must be a valid PostgreSQL connection string`);
    }

    if (envVar === 'JWT_SECRET' && value.length < 32) {
      invalid.push(`${envVar}: Must be at least 32 characters`);
    }

    if (envVar === 'REFRESH_TOKEN_SECRET' && value.length < 32) {
      invalid.push(`${envVar}: Must be at least 32 characters`);
    }

    if ((envVar === 'UPSTASH_REDIS_REST_URL' || envVar === 'UPSTASH_REDIS_REST_TOKEN') &&
        value.length < 10) {
      invalid.push(`${envVar}: Looks incomplete`);
    }

    if (envVar === 'ALLOWED_ORIGINS' && !value.includes(',') && !value.startsWith('http')) {
      invalid.push(`${envVar}: Must contain valid URLs separated by commas`);
    }
  }

  // Warnings for optional variables
  const warnings = [];
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  // Report errors
  if (missing.length > 0 || invalid.length > 0) {
    console.error('\n❌ ENVIRONMENT CONFIGURATION ERROR\n');
    
    if (missing.length > 0) {
      console.error('🔴 Missing required environment variables:');
      missing.forEach(v => console.error(`   - ${v}`));
    }

    if (invalid.length > 0) {
      console.error('\n🟠 Invalid environment variables:');
      invalid.forEach(v => console.error(`   - ${v}`));
    }

    console.error('\n📋 Copy .env.example to .env and fill in all values:\n');
    console.error('   $ cp .env.example .env\n');
    
    process.exit(1);
  }

  // Warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Optional environment variables not set (some features disabled):');
    warnings.forEach(v => console.warn(`   - ${v}`));
  }

  console.log('✅ All required environment variables validated\n');
}

module.exports = { validateEnvironment };
