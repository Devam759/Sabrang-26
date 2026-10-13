/**
 * Secure Environment Configuration & Secrets Integrity Validator
 * Validates that all production secrets and security keys are present,
 * securely configured, and not using insecure defaults or placeholder values.
 * Prevents accidental exposure of server secrets to the frontend via NEXT_PUBLIC_ prefixes.
 * Never outputs raw secret strings to logs or responses.
 */

if (typeof window !== 'undefined') {
  throw new Error('SECURITY VIOLATION: envValidation.ts is a server-only module.');
}

export interface EnvValidationReport {
  isProduction: boolean;
  valid: boolean;
  missingRequired: string[];
  placeholderDetected: string[];
  criticalFrontendLeaks: string[];
  warnings: string[];
}

const PLACEHOLDER_PATTERNS = [
  /^your_/i,
  /^your-/i,
  /placeholder/i,
  /example/i,
  /xxx/i,
  /dummy/i,
  /reconcile_cron_secret_token/i,
];

// Dangerous keys that must NEVER have a NEXT_PUBLIC_ prefix (which leaks to browser bundles)
const FORBIDDEN_FRONTEND_KEYS = [
  'NEXT_PUBLIC_FIREBASE_PRIVATE_KEY',
  'NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT',
  'NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL',
  'NEXT_PUBLIC_CASHFREE_SECRET_KEY',
  'NEXT_PUBLIC_BREVO_API_KEY',
  'NEXT_PUBLIC_CRON_SECRET',
  'NEXT_PUBLIC_RECAPTCHA_SECRET_KEY',
  'NEXT_PUBLIC_SESSION_SECRET',
  'NEXT_PUBLIC_CLOUDINARY_API_SECRET',
  'NEXT_PUBLIC_SMTP_PASS',
];

function isPlaceholder(val: string | undefined): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  if (trimmed === '') return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function validateEnvironmentConfiguration(): EnvValidationReport {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (process.env.NEXT_PUBLIC_CASHFREE_ENV || '').trim().toUpperCase() === 'PRODUCTION';

  const requiredInProduction = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'CRON_SECRET',
  ];

  const recommendedKeys = [
    'CASHFREE_APP_ID',
    'CASHFREE_SECRET_KEY',
    'BREVO_API_KEY',
    'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
    'RECAPTCHA_SECRET_KEY',
    'SESSION_SECRET',
  ];

  const missingRequired: string[] = [];
  const placeholderDetected: string[] = [];
  const criticalFrontendLeaks: string[] = [];
  const warnings: string[] = [];

  // 1. Audit for accidental frontend leakage (NEXT_PUBLIC_ server secrets)
  for (const forbiddenKey of FORBIDDEN_FRONTEND_KEYS) {
    const leakedVal = process.env[forbiddenKey];
    if (leakedVal && leakedVal.trim() !== '') {
      criticalFrontendLeaks.push(forbiddenKey);
    }
  }

  // 2. Check required keys in production
  for (const key of requiredInProduction) {
    const val = process.env[key];
    if (!val || val.trim() === '') {
      // In production, FIREBASE_SERVICE_ACCOUNT can substitute individual fields
      if (
        (key === 'FIREBASE_CLIENT_EMAIL' || key === 'FIREBASE_PROJECT_ID') &&
        process.env.FIREBASE_SERVICE_ACCOUNT
      ) {
        continue;
      }
      missingRequired.push(key);
    } else if (isPlaceholder(val)) {
      placeholderDetected.push(key);
    }
  }

  // 3. Check recommended keys
  for (const key of recommendedKeys) {
    const val = process.env[key];
    if (!val || val.trim() === '') {
      warnings.push(`Recommended secret '${key}' is not set.`);
    } else if (isPlaceholder(val)) {
      warnings.push(`Secret '${key}' appears to contain a placeholder default.`);
    }
  }

  // 4. Check private key formatting if configured
  if (process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_SERVICE_ACCOUNT) {
    if (!process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
      warnings.push("FIREBASE_PRIVATE_KEY does not contain valid PEM header '-----BEGIN PRIVATE KEY-----'.");
    }
  }

  // Valid only if no critical frontend leaks and (in production) no missing required secrets
  const valid = criticalFrontendLeaks.length === 0 && (
    isProduction
      ? missingRequired.length === 0 && placeholderDetected.length === 0
      : true
  );

  return {
    isProduction,
    valid,
    missingRequired,
    placeholderDetected,
    criticalFrontendLeaks,
    warnings,
  };
}

/**
 * Masks a secret string for safe logging (e.g. `sk_live_...4a9f`).
 */
export function maskSecret(secret: string | undefined): string {
  if (!secret) return '[NOT CONFIGURED]';
  const clean = secret.trim();
  if (clean.length <= 8) return '****';
  return `${clean.slice(0, 4)}...${clean.slice(-4)}`;
}
