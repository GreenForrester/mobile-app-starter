import { createMemoryStore, type KeyValueStore } from '../storage';
import type { AuthBackend, ProviderIdentity, Session } from '../types';
import { createFakeAuthBackend, RECENT_SIGN_IN_WINDOW_MS } from './createFakeAuthBackend';
import { DEMO_ACCOUNTS } from './demo-accounts';

const { plain, secondFactor } = DEMO_ACCOUNTS;

let clock: number;
let stores: { accounts: KeyValueStore; session: KeyValueStore };
let backend: AuthBackend;

const now = () => clock;
const restart = () => createFakeAuthBackend({ ...stores, now });

beforeEach(() => {
  clock = 1_000_000;
  stores = { accounts: createMemoryStore(), session: createMemoryStore() };
  backend = restart();
});

async function signInPlain(b: AuthBackend = backend): Promise<Session> {
  const result = await b.signInWithPassword(plain.email, plain.password);
  if (result.status !== 'signed-in') throw new Error(`expected signed-in, got ${result.status}`);
  return result.session;
}

const google = (subject: string): ProviderIdentity => ({
  provider: 'google',
  subject,
  idToken: 't',
  email: 'g@example.com',
});

describe('Password Sign-in', () => {
  it('signs in the plain demo Account', async () => {
    const result = await backend.signInWithPassword(plain.email, plain.password);
    expect(result).toMatchObject({
      status: 'signed-in',
      session: { account: { email: 'demo@example.com', method: 'password' }, signedInAt: clock },
    });
  });

  it('rejects a wrong password and an unknown email the same way', async () => {
    expect(await backend.signInWithPassword(plain.email, 'wrong-password')).toEqual({ status: 'wrong-credentials' });
    expect(await backend.signInWithPassword('nobody@example.com', plain.password)).toEqual({
      status: 'wrong-credentials',
    });
  });

  it('treats email case and surrounding spaces as the same Account', async () => {
    const result = await backend.signInWithPassword('  Demo@Example.COM ', 'Password123!');
    expect(result.status).toBe('signed-in');
  });
});

describe('Second Factor', () => {
  it('asks for a code, rejects a wrong one, then accepts the right one on the same challenge', async () => {
    const first = await backend.signInWithPassword(secondFactor.email, secondFactor.password);
    if (first.status !== 'second-factor-required') throw new Error(`got ${first.status}`);
    expect(first.challengeId).toEqual(expect.any(String));

    expect(await backend.submitSecondFactor(first.challengeId, '000000')).toEqual({ status: 'wrong-code' });
    const second = await backend.submitSecondFactor(first.challengeId, '123456');
    expect(second).toMatchObject({ status: 'signed-in', session: { account: { email: 'demo-2fa@example.com' } } });
  });
});

describe('Sign-up', () => {
  it('creates an Account and signs it in', async () => {
    expect(await backend.signUp('new@example.com', 'abcdefgh')).toMatchObject({
      status: 'signed-in',
      session: { account: { email: 'new@example.com', method: 'password' } },
    });
  });

  it('refuses an email already in use, whatever its case', async () => {
    await backend.signUp('new@example.com', 'abcdefgh');
    expect(await backend.signUp('NEW@example.com', 'abcdefgh')).toEqual({ status: 'email-in-use' });
  });

  it('refuses a password shorter than 8 characters', async () => {
    expect(await backend.signUp('x@example.com', 'abcdefg')).toEqual({ status: 'weak-password' });
  });

  it('keeps the new Account after a restart', async () => {
    await backend.signUp('new@example.com', 'abcdefgh');
    const result = await restart().signInWithPassword('new@example.com', 'abcdefgh');
    expect(result.status).toBe('signed-in');
  });
});

describe('Password Reset', () => {
  it('reports sent for known and unknown emails and changes nothing', async () => {
    expect(await backend.requestPasswordReset('demo@example.com')).toEqual({ status: 'sent' });
    expect(await backend.requestPasswordReset('nobody@example.com')).toEqual({ status: 'sent' });
    expect((await backend.signInWithPassword(plain.email, plain.password)).status).toBe('signed-in');
  });
});

describe('Restoring the session', () => {
  it('returns the same session after a restart', async () => {
    const session = await signInPlain();
    clock += 60_000;
    expect(await restart().restoreSession()).toEqual(session);
  });

  it('returns null after Sign-out', async () => {
    await signInPlain();
    await backend.signOut();
    expect(await restart().restoreSession()).toBeNull();
  });
});

describe('Account Deletion', () => {
  it('deletes the Account when the Sign-in is recent', async () => {
    await signInPlain();
    expect(await backend.deleteAccount()).toEqual({ status: 'deleted' });
    expect(await backend.signInWithPassword(plain.email, plain.password)).toEqual({ status: 'wrong-credentials' });
    expect(await backend.restoreSession()).toBeNull();
  });

  it('asks for a recent Sign-in when the last one is too old, then deletes after reauthentication', async () => {
    await signInPlain();
    clock += RECENT_SIGN_IN_WINDOW_MS + 1;
    expect(await backend.deleteAccount()).toEqual({ status: 'recent-sign-in-required' });

    expect(await backend.reauthenticate({ kind: 'password', password: 'wrong' })).toEqual({
      status: 'wrong-credentials',
    });
    expect(await backend.reauthenticate({ kind: 'password', password: plain.password })).toMatchObject({
      status: 'signed-in',
      session: { signedInAt: clock },
    });
    expect(await backend.deleteAccount()).toEqual({ status: 'deleted' });
  });

  it('asks the 2FA Account for its code again before deleting', async () => {
    const first = await backend.signInWithPassword(secondFactor.email, secondFactor.password);
    if (first.status !== 'second-factor-required') throw new Error(`got ${first.status}`);
    await backend.submitSecondFactor(first.challengeId, secondFactor.code);
    clock += RECENT_SIGN_IN_WINDOW_MS + 1;
    expect(await backend.deleteAccount()).toEqual({ status: 'recent-sign-in-required' });

    const again = await backend.reauthenticate({ kind: 'password', password: secondFactor.password });
    if (again.status !== 'second-factor-required') throw new Error(`got ${again.status}`);
    expect(await backend.submitSecondFactor(again.challengeId, secondFactor.code)).toMatchObject({
      status: 'signed-in',
      session: { signedInAt: clock },
    });
    expect(await backend.deleteAccount()).toEqual({ status: 'deleted' });
  });

  it('keeps the original Sign-in time across a restart', async () => {
    await signInPlain();
    clock += RECENT_SIGN_IN_WINDOW_MS + 1;
    const restarted = restart();
    await restarted.restoreSession();
    expect(await restarted.deleteAccount()).toEqual({ status: 'recent-sign-in-required' });
  });

  it('brings the demo Accounts back on the next start', async () => {
    await signInPlain();
    await backend.deleteAccount();
    expect((await restart().signInWithPassword(plain.email, plain.password)).status).toBe('signed-in');
  });
});

describe('Google and Apple', () => {
  it('signs in with a provider identity and recognizes the same subject again', async () => {
    const first = await backend.signInWithProvider(google('g-1'));
    if (first.status !== 'signed-in') throw new Error(`got ${first.status}`);
    expect(first.session.account.method).toBe('google');

    const second = await backend.signInWithProvider(google('g-1'));
    if (second.status !== 'signed-in') throw new Error(`got ${second.status}`);
    expect(second.session.account.id).toBe(first.session.account.id);
  });

  it('reauthenticates a Google Account only with the same subject', async () => {
    await backend.signInWithProvider(google('g-1'));
    expect(await backend.reauthenticate({ kind: 'provider', identity: google('g-2') })).toEqual({
      status: 'wrong-credentials',
    });
    expect((await backend.reauthenticate({ kind: 'provider', identity: google('g-1') })).status).toBe('signed-in');
  });
});
