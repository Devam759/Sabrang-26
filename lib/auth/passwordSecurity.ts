import crypto from 'crypto';

/**
 * Enterprise Password Security & Cryptographic Token Utility
 */

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0 to 4
  errors: string[];
}

/**
 * Validates a password against senior security engineering standards:
 * - Minimum 10 characters length (12+ recommended)
 * - Must contain lowercase letters
 * - Must contain uppercase letters
 * - Must contain numeric digits
 * - Must contain special symbols
 * - Must not be a commonly blacklisted password pattern
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      score: 0,
      errors: ['Password cannot be empty.'],
    };
  }

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long.');
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z).');
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z).');
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit (0-9).');
  } else {
    score++;
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.).');
  }

  // Blacklist obvious sequences
  const lower = password.toLowerCase();
  const commonWeak = ['password', '123456', 'admin123', 'sabrang', 'welcome', 'qwerty'];
  if (commonWeak.some((weak) => lower.includes(weak))) {
    errors.push('Password contains easily guessable dictionary words or patterns.');
    score = Math.max(0, score - 2);
  }

  return {
    valid: errors.length === 0,
    score: Math.min(4, Math.max(0, score)),
    errors,
  };
}

/**
 * Generates a high-entropy, cryptographically secure random password.
 * Guaranteed to satisfy all standard password complexity criteria.
 */
export function generateStrongPassword(length = 16): string {
  const finalLength = Math.max(12, length);
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const allChars = lowercase + uppercase + numbers + symbols;

  const bytes = crypto.randomBytes(finalLength * 2);
  const chars: string[] = [];

  // Guarantee at least 2 chars from each character class
  const pick = (charset: string) => {
    const byte = bytes[chars.length % bytes.length];
    return charset[byte % charset.length];
  };

  chars.push(pick(lowercase));
  chars.push(pick(lowercase));
  chars.push(pick(uppercase));
  chars.push(pick(uppercase));
  chars.push(pick(numbers));
  chars.push(pick(numbers));
  chars.push(pick(symbols));
  chars.push(pick(symbols));

  // Fill the remainder
  for (let i = chars.length; i < finalLength; i++) {
    const byte = bytes[i % bytes.length];
    chars.push(allChars[byte % allChars.length]);
  }

  // Fisher-Yates shuffle with cryptographic random values
  for (let i = chars.length - 1; i > 0; i--) {
    const randomByte = crypto.randomBytes(1)[0];
    const j = randomByte % (i + 1);
    const temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }

  return chars.join('');
}

/**
 * Generates a high-entropy random token for password resets or email verification.
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Computes a SHA-256 one-way cryptographic hash of a token.
 * Tokens should always be hashed before storage in the database to prevent exposure if the database is read.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time string equality check to prevent timing side-channel attacks.
 */
export function safeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
