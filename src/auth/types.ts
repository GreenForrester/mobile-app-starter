// The Auth Backend seam. Screens never talk to a backend directly: a Derived App swaps the
// Fake Auth Backend for Firebase Auth, Supabase or its own server by implementing AuthBackend.
// The result shapes follow how real services behave, not just what the Fake needs.

export type SignInMethod = 'password' | 'google' | 'apple';

export type Account = { id: string; email: string; method: SignInMethod };

export type Session = { account: Account; signedInAt: number };

export type ProviderIdentity = {
  provider: 'google' | 'apple';
  subject: string;
  idToken: string;
  email: string | null;
};

export type SignedIn = { status: 'signed-in'; session: Session };
export type SecondFactorRequired = { status: 'second-factor-required'; challengeId: string };
// The service couldn't be reached at all (no network, timeout).
export type Unreachable = { status: 'unreachable' };
// The service refused because of too many attempts (Firebase too-many-requests, HTTP 429).
export type RateLimited = { status: 'rate-limited' };
type Problem = Unreachable | RateLimited;

export type SignUpResult =
  | SignedIn
  | { status: 'confirmation-required' }
  | { status: 'email-in-use' }
  | { status: 'weak-password' }
  | Problem;

export type PasswordSignInResult =
  | SignedIn
  | SecondFactorRequired
  // The Account exists but its email isn't confirmed yet (Supabase's default).
  | { status: 'confirmation-required' }
  | { status: 'wrong-credentials' }
  | Problem;

export type SecondFactorResult = SignedIn | { status: 'wrong-code' } | Problem;

export type ProviderSignInResult = SignedIn | Problem;

export type PasswordResetResult = { status: 'sent' } | Problem;

export type ReauthProof = { kind: 'password'; password: string } | { kind: 'provider'; identity: ProviderIdentity };

// An Account with a Second Factor answers a challenge again (Firebase multi-factor-auth-required).
export type ReauthResult = SignedIn | SecondFactorRequired | { status: 'wrong-credentials' } | Problem;

export type AccountDeletionResult = { status: 'deleted' } | { status: 'recent-sign-in-required' } | Problem;

// Emails and Second Factor codes arrive trimmed; how letter case is treated is up to the backend.
export interface AuthBackend {
  restoreSession(): Promise<Session | null>;
  signUp(email: string, password: string): Promise<SignUpResult>;
  signInWithPassword(email: string, password: string): Promise<PasswordSignInResult>;
  // Answers a challenge from Sign-in or from reauthenticate; either way a fresh session follows.
  submitSecondFactor(challengeId: string, code: string): Promise<SecondFactorResult>;
  signInWithProvider(identity: ProviderIdentity): Promise<ProviderSignInResult>;
  // Same answer whether or not an Account exists, so the screen never reveals who has one.
  requestPasswordReset(email: string): Promise<PasswordResetResult>;
  // A signed-in result carries a fresh signedInAt.
  reauthenticate(proof: ReauthProof): Promise<ReauthResult>;
  // Acts on the current session.
  deleteAccount(): Promise<AccountDeletionResult>;
  signOut(): Promise<void>;
}
