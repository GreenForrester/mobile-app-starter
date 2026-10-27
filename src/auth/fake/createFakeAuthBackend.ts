import { MIN_PASSWORD_LENGTH } from '../password-rules';
import type { KeyValueStore } from '../storage';
import type { Account, AuthBackend, ProviderIdentity, Session, SignedIn, SignInMethod } from '../types';
import { DEMO_ACCOUNTS } from './demo-accounts';

// How long a Sign-in counts as recent for Account Deletion.
export const RECENT_SIGN_IN_WINDOW_MS = 5 * 60 * 1000;

const ACCOUNTS_KEY = 'fake-auth.accounts';
const SESSION_KEY = 'fake-auth.session';

type StoredAccount = {
  id: string;
  email: string;
  method: SignInMethod;
  password?: string;
  secondFactorCode?: string;
  subject?: string;
};

const DEMO_SEEDS: StoredAccount[] = [
  { id: 'demo-plain', email: DEMO_ACCOUNTS.plain.email, method: 'password', password: DEMO_ACCOUNTS.plain.password },
  {
    id: 'demo-2fa',
    email: DEMO_ACCOUNTS.secondFactor.email,
    method: 'password',
    password: DEMO_ACCOUNTS.secondFactor.password,
    secondFactorCode: DEMO_ACCOUNTS.secondFactor.code,
  },
];

// The Auth Backend the Starter ships with. It runs on the phone and needs no setup, but it
// behaves like a real service wherever the screens need to handle it: Second Factor
// challenges, recent Sign-in before Account Deletion, and a Password Reset that only "sends".
export function createFakeAuthBackend(options: {
  accounts: KeyValueStore;
  session: KeyValueStore;
  now?: () => number;
  delayMs?: number;
}): AuthBackend {
  const { accounts, session, now = Date.now, delayMs = 0 } = options;
  const challenges = new Map<string, string>(); // challengeId → account id
  let seeded: Promise<void> | null = null;

  async function loadAccounts(): Promise<StoredAccount[]> {
    const raw = await accounts.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async function saveAccounts(list: StoredAccount[]): Promise<void> {
    await accounts.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  }

  async function seedDemoAccounts(): Promise<void> {
    const list = await loadAccounts();
    const missing = DEMO_SEEDS.filter((demo) => !list.some((account) => account.email === demo.email));
    if (missing.length > 0) await saveAccounts([...list, ...missing]);
  }

  // Every action waits like a network call would, then makes sure the demo Accounts exist.
  async function begin(): Promise<void> {
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    seeded ??= seedDemoAccounts();
    await seeded;
  }

  async function startSession(account: StoredAccount): Promise<SignedIn> {
    const next: Session = { account: toAccount(account), signedInAt: now() };
    await session.setItem(SESSION_KEY, JSON.stringify(next));
    return { status: 'signed-in', session: next };
  }

  async function currentSession(): Promise<Session | null> {
    const raw = await session.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  async function currentAccount(): Promise<StoredAccount | null> {
    const active = await currentSession();
    if (!active) return null;
    return (await loadAccounts()).find((account) => account.id === active.account.id) ?? null;
  }

  return {
    async restoreSession() {
      await begin();
      if (!(await currentAccount())) {
        await session.removeItem(SESSION_KEY);
        return null;
      }
      return currentSession();
    },

    async signUp(email, password) {
      await begin();
      const normalized = normalizeEmail(email);
      const list = await loadAccounts();
      if (list.some((account) => account.email === normalized)) return { status: 'email-in-use' };
      if (password.length < MIN_PASSWORD_LENGTH) return { status: 'weak-password' };
      const account: StoredAccount = { id: newId('acct'), email: normalized, method: 'password', password };
      await saveAccounts([...list, account]);
      return startSession(account);
    },

    async signInWithPassword(email, password) {
      await begin();
      const normalized = normalizeEmail(email);
      const account = (await loadAccounts()).find((a) => a.method === 'password' && a.email === normalized);
      if (!account || account.password !== password) return { status: 'wrong-credentials' };
      if (account.secondFactorCode) {
        const challengeId = newId('challenge');
        challenges.set(challengeId, account.id);
        return { status: 'second-factor-required', challengeId };
      }
      return startSession(account);
    },

    async submitSecondFactor(challengeId, code) {
      await begin();
      const accountId = challenges.get(challengeId);
      const account = (await loadAccounts()).find((a) => a.id === accountId);
      if (!account || account.secondFactorCode !== code.trim()) return { status: 'wrong-code' };
      challenges.delete(challengeId);
      return startSession(account);
    },

    async signInWithProvider(identity) {
      await begin();
      const list = await loadAccounts();
      const existing = list.find((a) => matchesProvider(a, identity));
      if (existing) return startSession(existing);
      const account: StoredAccount = {
        id: newId('acct'),
        email: identity.email ? normalizeEmail(identity.email) : `${identity.provider}-${identity.subject}@example.com`,
        method: identity.provider,
        subject: identity.subject,
      };
      await saveAccounts([...list, account]);
      return startSession(account);
    },

    async requestPasswordReset() {
      await begin();
      return { status: 'sent' };
    },

    async reauthenticate(proof) {
      await begin();
      const account = await currentAccount();
      const confirmed =
        account !== null &&
        (proof.kind === 'password'
          ? account.method === 'password' && account.password === proof.password
          : matchesProvider(account, proof.identity));
      if (!account || !confirmed) return { status: 'wrong-credentials' };
      return startSession(account);
    },

    async deleteAccount() {
      await begin();
      const active = await currentSession();
      if (!active || now() - active.signedInAt > RECENT_SIGN_IN_WINDOW_MS) {
        return { status: 'recent-sign-in-required' };
      }
      await saveAccounts((await loadAccounts()).filter((account) => account.id !== active.account.id));
      await session.removeItem(SESSION_KEY);
      return { status: 'deleted' };
    },

    async signOut() {
      await begin();
      await session.removeItem(SESSION_KEY);
    },
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function matchesProvider(account: StoredAccount, identity: ProviderIdentity): boolean {
  return account.method === identity.provider && account.subject === identity.subject;
}

function toAccount({ id, email, method }: StoredAccount): Account {
  return { id, email, method };
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
