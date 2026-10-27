import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createTestBackend, stubProviders } from '@/test-utils/auth';

import { AuthProvider, useAuth, type ProviderSignIn } from './AuthProvider';
import { DEMO_ACCOUNTS } from './fake/demo-accounts';
import type { AuthBackend, ProviderIdentity, Session } from './types';

const { plain, secondFactor } = DEMO_ACCOUNTS;
const googleIdentity: ProviderIdentity = { provider: 'google', subject: 'g-1', idToken: 't', email: 'g@example.com' };

// Backend failures are logged in development; keep that out of the test output.
let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
});

async function renderAuth(backend: AuthBackend, providers = stubProviders()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider
      backend={backend}
      providers={providers}
      signInMethods={{ password: true, google: true, apple: false }}
      demoAccounts={DEMO_ACCOUNTS}
    >
      {children}
    </AuthProvider>
  );
  const rendered = await renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(rendered.result.current.state.status).not.toBe('loading'));
  return rendered;
}

describe('restoring the session', () => {
  it('starts as loading, then signed-out when there is no session', async () => {
    const backend = createTestBackend();
    let finish: (session: Session | null) => void = () => {};
    jest.spyOn(backend, 'restoreSession').mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result } = await renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider backend={backend} providers={stubProviders()} signInMethods={{ password: true, google: false, apple: false }} demoAccounts={null}>
          {children}
        </AuthProvider>
      ),
    });
    expect(result.current.state.status).toBe('loading');
    await act(async () => finish(null));
    expect(result.current.state.status).toBe('signed-out');
  });

  it('is signed-in when the backend restores a session', async () => {
    const backend = createTestBackend();
    await backend.signInWithPassword(plain.email, plain.password);
    const { result } = await renderAuth(backend);
    expect(result.current.state).toMatchObject({ status: 'signed-in', session: { account: { email: plain.email } } });
  });

  it('is signed-out when restoring throws', async () => {
    const backend = createTestBackend();
    jest.spyOn(backend, 'restoreSession').mockRejectedValue(new Error('offline'));
    const { result } = await renderAuth(backend);
    expect(result.current.state.status).toBe('signed-out');
  });
});

describe('Password Sign-in', () => {
  it('signs in the plain demo Account', async () => {
    const { result } = await renderAuth(createTestBackend());
    await act(() => result.current.signInWithPassword(plain.email, plain.password));
    expect(result.current.state).toMatchObject({ status: 'signed-in', session: { account: { email: plain.email } } });
  });

  it('stays signed-out while a Second Factor is required', async () => {
    const { result } = await renderAuth(createTestBackend());
    const outcome = await act(() => result.current.signInWithPassword(secondFactor.email, secondFactor.password));
    expect(outcome.status).toBe('second-factor-required');
    expect(result.current.state.status).toBe('signed-out');
  });

  it('turns a thrown error into unreachable and keeps the state', async () => {
    const backend = createTestBackend();
    jest.spyOn(backend, 'signInWithPassword').mockRejectedValue(new Error('offline'));
    const { result } = await renderAuth(backend);
    const outcome = await act(() => result.current.signInWithPassword(plain.email, plain.password));
    expect(outcome).toEqual({ status: 'unreachable' });
    expect(result.current.state.status).toBe('signed-out');
  });
});

describe('what reaches the backend', () => {
  it('trims emails and codes before calling the backend', async () => {
    const backend = createTestBackend();
    const signIn = jest.spyOn(backend, 'signInWithPassword');
    const signUp = jest.spyOn(backend, 'signUp');
    const reset = jest.spyOn(backend, 'requestPasswordReset');
    const code = jest.spyOn(backend, 'submitSecondFactor');
    const { result } = await renderAuth(backend);

    const outcome = await act(() => result.current.signInWithPassword('  demo-2fa@example.com ', secondFactor.password));
    if (outcome.status !== 'second-factor-required') throw new Error(`got ${outcome.status}`);
    await act(() => result.current.submitSecondFactor(outcome.challengeId, ' 123456 '));
    await act(() => result.current.signUp(' new@example.com ', 'abcdefgh'));
    await act(() => result.current.requestPasswordReset(' demo@example.com '));

    expect(signIn).toHaveBeenCalledWith('demo-2fa@example.com', secondFactor.password);
    expect(code).toHaveBeenCalledWith(outcome.challengeId, '123456');
    expect(signUp).toHaveBeenCalledWith('new@example.com', 'abcdefgh');
    expect(reset).toHaveBeenCalledWith('demo@example.com');
  });

  it('logs what the backend threw, in development', async () => {
    const backend = createTestBackend();
    const error = new Error('DEVELOPER_ERROR');
    jest.spyOn(backend, 'signInWithPassword').mockRejectedValue(error);
    const { result } = await renderAuth(backend);
    await act(() => result.current.signInWithPassword(plain.email, plain.password));
    expect(warn).toHaveBeenCalledWith('[auth] signInWithPassword failed', error);
  });
});

describe('Google', () => {
  it('reports cancelled without calling the backend when the person cancels', async () => {
    const backend = createTestBackend();
    const spy = jest.spyOn(backend, 'signInWithProvider');
    const { result } = await renderAuth(backend, stubProviders({ google: async () => null }));
    const outcome = await act(() => result.current.signInWithProvider('google'));
    expect(outcome).toEqual({ status: 'cancelled' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('signs in with the identity the provider returns', async () => {
    const { result } = await renderAuth(createTestBackend(), stubProviders({ google: async () => googleIdentity }));
    await act(() => result.current.signInWithProvider('google'));
    expect(result.current.state).toMatchObject({ status: 'signed-in', session: { account: { method: 'google' } } });
  });
});

describe('Account Deletion and Sign-out', () => {
  it('is signed-out after the Account is deleted', async () => {
    const { result } = await renderAuth(createTestBackend());
    await act(() => result.current.signInWithPassword(plain.email, plain.password));
    const outcome = await act(() => result.current.deleteAccount());
    expect(outcome).toEqual({ status: 'deleted' });
    expect(result.current.state.status).toBe('signed-out');
  });

  it('is signed-out after Sign-out even when the backend fails', async () => {
    const backend = createTestBackend();
    jest.spyOn(backend, 'signOut').mockRejectedValue(new Error('offline'));
    const { result } = await renderAuth(backend);
    await act(() => result.current.signInWithPassword(plain.email, plain.password));
    await act(() => result.current.signOut());
    expect(result.current.state.status).toBe('signed-out');
  });

  it('signs out of Google too, so the next person can pick another Google account', async () => {
    const google: ProviderSignIn = Object.assign(jest.fn(async () => googleIdentity), {
      signOut: jest.fn(async () => {}),
    });
    const { result } = await renderAuth(createTestBackend(), stubProviders({ google }));
    await act(() => result.current.signInWithProvider('google'));
    await act(() => result.current.signOut());
    expect(google.signOut).toHaveBeenCalledTimes(1);
  });

  it('signs out of Google after its Account is deleted', async () => {
    const google: ProviderSignIn = Object.assign(jest.fn(async () => googleIdentity), {
      signOut: jest.fn(async () => {}),
    });
    const { result } = await renderAuth(createTestBackend(), stubProviders({ google }));
    await act(() => result.current.signInWithProvider('google'));
    await act(() => result.current.deleteAccount());
    expect(google.signOut).toHaveBeenCalledTimes(1);
  });

  it('reauthenticates a Google Account through the Google provider', async () => {
    const google: ProviderSignIn = jest.fn(async () => googleIdentity);
    const { result } = await renderAuth(createTestBackend(), stubProviders({ google }));
    await act(() => result.current.signInWithProvider('google'));
    (google as jest.Mock).mockClear();
    const outcome = await act(() => result.current.reauthenticate({ kind: 'provider' }));
    expect(outcome.status).toBe('signed-in');
    expect(google).toHaveBeenCalledTimes(1);
  });
});
