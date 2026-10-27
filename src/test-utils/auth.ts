import type { ProviderSignIn } from '@/auth/AuthProvider';
import { createFakeAuthBackend } from '@/auth/fake/createFakeAuthBackend';
import { createMemoryStore } from '@/auth/storage';
import type { AuthBackend } from '@/auth/types';

// A Fake Auth Backend on in-memory stores that answers immediately.
export function createTestBackend(options: { now?: () => number } = {}): AuthBackend {
  return createFakeAuthBackend({ accounts: createMemoryStore(), session: createMemoryStore(), now: options.now });
}

// Stand-ins for the native Google and Apple sheets. By default the person cancels.
export function stubProviders(
  overrides: Partial<Record<'google' | 'apple', ProviderSignIn>> = {},
): Record<'google' | 'apple', ProviderSignIn> {
  return { google: async () => null, apple: async () => null, ...overrides };
}
