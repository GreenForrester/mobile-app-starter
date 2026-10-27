import { MESSAGES } from './messages';

// Checks the screens make before calling the Auth Backend. The backend still has the final
// say (for example on password strength), so these only catch what's plainly missing.

export function validateEmail(raw: string): string | null {
  const email = raw.trim();
  if (!email) return MESSAGES.emailRequired;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return MESSAGES.emailInvalid;
  return null;
}

export function validateRequired(raw: string, message: string): string | null {
  return raw.trim() ? null : message;
}
