import { asyncStorageStore, secureStore } from './device-storage';
import { createFakeAuthBackend } from './fake/createFakeAuthBackend';
import { DEMO_ACCOUNTS, type DemoAccounts } from './fake/demo-accounts';
import type { AuthBackend } from './types';

// The Auth Backend this app uses. To plug in a real one (Firebase Auth, Supabase or your own
// server), implement AuthBackend from ./types and export it here instead of the Fake.
export const authBackend: AuthBackend = createFakeAuthBackend({
  accounts: asyncStorageStore,
  session: secureStore,
  delayMs: 400,
});

// Shown on the sign-in screen. Set this to null when a real Auth Backend is swapped in.
export const demoAccounts: DemoAccounts | null = DEMO_ACCOUNTS;
