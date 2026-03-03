/**
 * Shared password validation — mirrors backend rules (Passay config).
 * 8-128 chars, uppercase, lowercase, digit, special char, no whitespace.
 */

const RULES = [
  { test: (p: string) => p.length >= 8, message: 'At least 8 characters' },
  { test: (p: string) => p.length <= 128, message: 'At most 128 characters' },
  { test: (p: string) => /[A-Z]/.test(p), message: 'At least one uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), message: 'At least one lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), message: 'At least one digit' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), message: 'At least one special character' },
  { test: (p: string) => !/\s/.test(p), message: 'No whitespace allowed' },
];

/** Returns first failing rule message, or null if valid. */
export function validatePassword(password: string): string | null {
  for (const rule of RULES) {
    if (!rule.test(password)) return rule.message;
  }
  return null;
}

/** Returns all failing rule messages. */
export function getPasswordErrors(password: string): string[] {
  return RULES.filter((r) => !r.test(password)).map((r) => r.message);
}

export interface PasswordStrength {
  score: number; // 0-100
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: 'Weak' };

  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  score = Math.min(100, score);

  let label: PasswordStrength['label'] = 'Weak';
  if (score >= 80) label = 'Strong';
  else if (score >= 60) label = 'Good';
  else if (score >= 40) label = 'Fair';

  return { score, label };
}
