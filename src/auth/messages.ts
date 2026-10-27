import { MIN_PASSWORD_LENGTH } from './password-rules';

// Every message the Sign-in and Account screens show. Tests assert this exact copy.
export const MESSAGES = {
  unreachable: "We couldn't reach the server. Check your connection and try again.",
  rateLimited: 'Too many attempts. Wait a few minutes, then try again.',
  wrongCredentials: "That email and password don't match. Try again.",
  wrongCode: "That code isn't right. Check it and try again.",
  emailRequired: 'Enter your email.',
  emailInvalid: 'Enter a valid email address.',
  passwordRequired: 'Enter your password.',
  codeRequired: 'Enter the 6-digit code.',
  emailInUse: 'An account with that email already exists. Try signing in.',
  weakPassword: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
  confirmationRequired: 'Check your email to confirm your account, then sign in.',
  resetSent: "If an account exists for that email, we've sent a link to reset your password.",
  deleteConfirm: "Delete your account? This can't be undone.",
  recentSignInRequired: 'For your security, sign in again to delete your account.',
};

// The message for an outcome where the Auth Backend couldn't help at all, or null.
export function problemMessage(result: { status: string }): string | null {
  if (result.status === 'unreachable') return MESSAGES.unreachable;
  if (result.status === 'rate-limited') return MESSAGES.rateLimited;
  return null;
}
