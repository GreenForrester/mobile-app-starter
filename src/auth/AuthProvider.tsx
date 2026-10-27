import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { DemoAccounts } from './fake/demo-accounts';
import type { EnabledSignInMethods } from './sign-in-methods';
import type {
  AccountDeletionResult,
  AuthBackend,
  PasswordResetResult,
  PasswordSignInResult,
  ProviderIdentity,
  ProviderSignInResult,
  ReauthResult,
  SecondFactorResult,
  Session,
  SignedIn,
  SignUpResult,
  Unreachable,
} from './types';

export type { EnabledSignInMethods } from './sign-in-methods';

// Opens the native Google or Apple sheet and resolves null when the person cancels. Its optional
// signOut ends the provider's own session, so the next Sign-in can pick a different account.
export type ProviderSignIn = { (): Promise<ProviderIdentity | null>; signOut?: () => Promise<void> };

export type Cancelled = { status: 'cancelled' };

export type AuthState = { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; session: Session };

type AuthContextValue = {
  state: AuthState;
  signInMethods: EnabledSignInMethods;
  demoAccounts: DemoAccounts | null;
  signUp(email: string, password: string): Promise<SignUpResult>;
  signInWithPassword(email: string, password: string): Promise<PasswordSignInResult>;
  submitSecondFactor(challengeId: string, code: string): Promise<SecondFactorResult>;
  signInWithProvider(provider: 'google' | 'apple'): Promise<ProviderSignInResult | Cancelled>;
  requestPasswordReset(email: string): Promise<PasswordResetResult>;
  reauthenticate(proof: { kind: 'password'; password: string } | { kind: 'provider' }): Promise<ReauthResult | Cancelled>;
  deleteAccount(): Promise<AccountDeletionResult>;
  signOut(): Promise<void>;
};

const UNREACHABLE: Unreachable = { status: 'unreachable' };
const SIGNED_OUT: AuthState = { status: 'signed-out' };

const AuthContext = createContext<AuthContextValue | null>(null);

// In development, show what actually went wrong; the person only sees "couldn't reach the server".
function logFailure(action: string, error: unknown) {
  if (__DEV__) console.warn(`[auth] ${action} failed`, error);
}

// The only way screens reach the Auth Backend. It trims emails and codes, turns results into a
// signed-in or signed-out state, and turns anything the backend throws into "unreachable".
export function AuthProvider(props: {
  backend: AuthBackend;
  providers: Record<'google' | 'apple', ProviderSignIn>;
  signInMethods: EnabledSignInMethods;
  demoAccounts: DemoAccounts | null;
  children: ReactNode;
}) {
  const { backend, providers, signInMethods, demoAccounts, children } = props;
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    backend
      .restoreSession()
      .catch((error) => {
        logFailure('restoreSession', error);
        return null;
      })
      .then((session) => {
        if (active) setState(session ? { status: 'signed-in', session } : SIGNED_OUT);
      });
    return () => {
      active = false;
    };
  }, [backend]);

  const value = useMemo<AuthContextValue>(() => {
    async function attempt<T extends { status: string }>(action: string, run: () => Promise<T>): Promise<T | Unreachable> {
      try {
        const result = await run();
        if (isSignedIn(result)) setState({ status: 'signed-in', session: result.session });
        return result;
      } catch (error) {
        logFailure(action, error);
        return UNREACHABLE;
      }
    }

    async function identityFrom(provider: 'google' | 'apple'): Promise<ProviderIdentity | Cancelled | Unreachable> {
      try {
        return (await providers[provider]()) ?? { status: 'cancelled' };
      } catch (error) {
        logFailure(`${provider} sign-in`, error);
        return UNREACHABLE;
      }
    }

    // After Sign-out or Account Deletion, also end the Google or Apple session.
    async function signOutOfProvider() {
      if (state.status !== 'signed-in') return;
      const { method } = state.session.account;
      if (method === 'password') return;
      try {
        await providers[method].signOut?.();
      } catch (error) {
        logFailure(`${method} sign-out`, error);
      }
    }

    return {
      state,
      signInMethods,
      demoAccounts,
      signUp: (email, password) => attempt('signUp', () => backend.signUp(email.trim(), password)),
      signInWithPassword: (email, password) =>
        attempt('signInWithPassword', () => backend.signInWithPassword(email.trim(), password)),
      submitSecondFactor: (challengeId, code) =>
        attempt('submitSecondFactor', () => backend.submitSecondFactor(challengeId, code.trim())),
      requestPasswordReset: (email) => attempt('requestPasswordReset', () => backend.requestPasswordReset(email.trim())),

      async signInWithProvider(provider) {
        const identity = await identityFrom(provider);
        if ('status' in identity) return identity;
        return attempt('signInWithProvider', () => backend.signInWithProvider(identity));
      },

      async reauthenticate(proof) {
        if (proof.kind === 'password') {
          return attempt('reauthenticate', () => backend.reauthenticate({ kind: 'password', password: proof.password }));
        }
        const method = state.status === 'signed-in' ? state.session.account.method : 'password';
        if (method === 'password') return { status: 'wrong-credentials' };
        const identity = await identityFrom(method);
        if ('status' in identity) return identity;
        return attempt('reauthenticate', () => backend.reauthenticate({ kind: 'provider', identity }));
      },

      async deleteAccount() {
        const result = await attempt('deleteAccount', () => backend.deleteAccount());
        if (result.status === 'deleted') {
          await signOutOfProvider();
          setState(SIGNED_OUT);
        }
        return result;
      },

      async signOut() {
        try {
          await backend.signOut();
        } catch (error) {
          // Signed out on this phone either way; the backend session expires on its own.
          logFailure('signOut', error);
        }
        await signOutOfProvider();
        setState(SIGNED_OUT);
      },
    };
  }, [backend, providers, signInMethods, demoAccounts, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

function isSignedIn(result: { status: string }): result is SignedIn {
  return result.status === 'signed-in';
}
