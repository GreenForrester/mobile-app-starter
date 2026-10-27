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

export type Unreachable = { status: 'unreachable' };
export type SignedIn = { status: 'signed-in'; session: Session };

export type SignUpResult =
  | SignedIn
  | { status: 'confirmation-required' }
  | { status: 'email-in-use' }
  | { status: 'weak-password' }
  | Unreachable;

export type PasswordSignInResult =
  | SignedIn
  | { status: 'second-factor-required'; challengeId: string }
  | { status: 'wrong-credentials' }
  | Unreachable;

export type SecondFactorResult = SignedIn | { status: 'wrong-code' } | Unreachable;

export type ProviderSignInResult = SignedIn | Unreachable;

export type PasswordResetResult = { status: 'sent' } | Unreachable;

export type ReauthProof = { kind: 'password'; password: string } | { kind: 'provider'; identity: ProviderIdentity };

export type ReauthResult = SignedIn | { status: 'wrong-credentials' } | Unreachable;

export type AccountDeletionResult = { status: 'deleted' } | { status: 'recent-sign-in-required' } | Unreachable;

export interface AuthBackend {
  restoreSession(): Promise<Session | null>;
  signUp(email: string, password: string): Promise<SignUpResult>;
  signInWithPassword(email: string, password: string): Promise<PasswordSignInResult>;
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
