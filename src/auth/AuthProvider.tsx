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

// Opens the native Google or Apple sheet. Resolves null when the person cancels.
export type ProviderSignIn = () => Promise<ProviderIdentity | null>;

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

// The only way screens reach the Auth Backend. It turns results into a signed-in or
// signed-out state, and turns anything the backend throws into "unreachable".
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
      .catch(() => null)
      .then((session) => {
        if (active) setState(session ? { status: 'signed-in', session } : SIGNED_OUT);
      });
    return () => {
      active = false;
    };
  }, [backend]);

  const value = useMemo<AuthContextValue>(() => {
    async function attempt<T extends { status: string }>(run: () => Promise<T>): Promise<T | Unreachable> {
      try {
        const result = await run();
        if (isSignedIn(result)) setState({ status: 'signed-in', session: result.session });
        return result;
      } catch {
        return UNREACHABLE;
      }
    }

    async function identityFrom(provider: 'google' | 'apple'): Promise<ProviderIdentity | Cancelled | Unreachable> {
      try {
        return (await providers[provider]()) ?? { status: 'cancelled' };
      } catch {
        return UNREACHABLE;
      }
    }

    return {
      state,
      signInMethods,
      demoAccounts,
      signUp: (email, password) => attempt(() => backend.signUp(email, password)),
      signInWithPassword: (email, password) => attempt(() => backend.signInWithPassword(email, password)),
      submitSecondFactor: (challengeId, code) => attempt(() => backend.submitSecondFactor(challengeId, code)),
      requestPasswordReset: (email) => attempt(() => backend.requestPasswordReset(email)),

      async signInWithProvider(provider) {
        const identity = await identityFrom(provider);
        if ('status' in identity) return identity;
        return attempt(() => backend.signInWithProvider(identity));
      },

      async reauthenticate(proof) {
        if (proof.kind === 'password') {
          return attempt(() => backend.reauthenticate({ kind: 'password', password: proof.password }));
        }
        const method = state.status === 'signed-in' ? state.session.account.method : 'password';
        if (method === 'password') return { status: 'wrong-credentials' };
        const identity = await identityFrom(method);
        if ('status' in identity) return identity;
        return attempt(() => backend.reauthenticate({ kind: 'provider', identity }));
      },

      async deleteAccount() {
        const result = await attempt(() => backend.deleteAccount());
        if (result.status === 'deleted') setState(SIGNED_OUT);
        return result;
      },

      async signOut() {
        try {
          await backend.signOut();
        } catch {
          // Signed out on this phone either way; the backend session expires on its own.
        }
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
