import { screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ComponentType } from 'react';

import { AuthProvider, type EnabledSignInMethods, type ProviderSignIn } from '@/auth/AuthProvider';
import { DEMO_ACCOUNTS, type DemoAccounts } from '@/auth/fake/demo-accounts';
import type { AuthBackend } from '@/auth/types';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider } from '@/theme/ThemeProvider';

import { createTestBackend, stubProviders } from './auth';

// Renders the real app/ routes with a test root layout in place of app/_layout.tsx, so each
// test chooses its own Auth Backend, provider stand-ins and Sign-in Methods.
export async function renderApp(
  options: {
    backend?: AuthBackend;
    providers?: Partial<Record<'google' | 'apple', ProviderSignIn>>;
    signInMethods?: Partial<EnabledSignInMethods>;
    demoAccounts?: DemoAccounts | null;
    initialUrl?: string;
    // Extra routes added beside the real ones, keyed like app/ paths, e.g. '(app)/details'.
    routes?: Record<string, ComponentType>;
  } = {},
) {
  const backend = options.backend ?? createTestBackend();
  const providers = stubProviders(options.providers);
  const signInMethods = { password: true, google: false, apple: false, ...options.signInMethods };
  const demoAccounts = options.demoAccounts === undefined ? DEMO_ACCOUNTS : options.demoAccounts;

  function TestRootLayout() {
    return (
      <ThemeProvider>
        <AuthProvider backend={backend} providers={providers} signInMethods={signInMethods} demoAccounts={demoAccounts}>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    );
  }

  const rendered = await renderRouter(
    { appDir: 'app', overrides: { ...options.routes, _layout: TestRootLayout } },
    { initialUrl: options.initialUrl ?? '/' },
  );
  // Wait for the session to be restored and the first screen to appear.
  await waitFor(() => expect(screen.toJSON()).not.toBeNull());
  return { backend, ...rendered };
}
