/**
 * Environment Variable Validation Module
 * Throws an error on startup/import if critical variables are missing.
 */

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ENCRYPTION_KEY",
  "NEXT_PUBLIC_APP_URL"
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `\n========================================================\n` +
      `❌ FATAL: MISSING REQUIRED ENVIRONMENT VARIABLES:\n` +
      missing.map(key => `   - ${key}`).join("\n") + "\n" +
      `========================================================\n`
    );
  }
}

// Auto-run validation when this file is imported, except during build time
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  validateEnv();
}
