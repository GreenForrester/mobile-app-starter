import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createFakeAuthBackend, RECENT_SIGN_IN_WINDOW_MS } from '@/auth/fake/createFakeAuthBackend';
import { DEMO_ACCOUNTS } from '@/auth/fake/demo-accounts';
import { MESSAGES } from '@/auth/messages';
import { createMemoryStore } from '@/auth/storage';
import type { AuthBackend, ProviderIdentity } from '@/auth/types';
import { stubProviders } from '@/test-utils/auth';
import { renderApp } from '@/test-utils/renderApp';

const { plain } = DEMO_ACCOUNTS;
const googleIdentity: ProviderIdentity = { provider: 'google', subject: 'g-1', idToken: 't', email: 'g@example.com' };

let clock: number;
let backend: AuthBackend;

beforeEach(() => {
  clock = 1_000_000;
  backend = createFakeAuthBackend({ accounts: createMemoryStore(), session: createMemoryStore(), now: () => clock });
});

const pressButton = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

async function openAccount(email = plain.email, providers = stubProviders()) {
  const app = await renderApp({ backend, providers, initialUrl: '/account' });
  await screen.findByText(`Signed in as ${email}`);
  return app;
}

async function confirmDeletion() {
  await pressButton('Delete account');
  expect(screen.getByText(MESSAGES.deleteConfirm)).toBeVisible();
  await pressButton('Delete account');
}

describe('signed in as the demo Account', () => {
  beforeEach(async () => {
    await backend.signInWithPassword(plain.email, plain.password);
  });

  it('shows the Account and the Home and Account tabs', async () => {
    const app = await openAccount();
    expect(app.getPathname()).toBe('/account');
    expect(screen.getByRole('button', { name: /^Home, tab/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Account, tab/ })).toBeOnTheScreen();
  });

  it('signs out, and stays signed out after a restart', async () => {
    const app = await openAccount();
    await pressButton('Sign out');
    await waitFor(() => expect(app.getPathname()).toBe('/sign-in'));

    await app.unmount();
    const restarted = await renderApp({ backend });
    expect(restarted.getPathname()).toBe('/sign-in');
  });

  it('deletes nothing when Account Deletion is cancelled', async () => {
    await openAccount();
    await pressButton('Delete account');
    await pressButton('Cancel');
    expect(screen.queryByText(MESSAGES.deleteConfirm)).toBeNull();
    expect((await backend.signInWithPassword(plain.email, plain.password)).status).toBe('signed-in');
  });

  it('deletes the Account after confirmation when the Sign-in is recent', async () => {
    const app = await openAccount();
    await confirmDeletion();
    await waitFor(() => expect(app.getPathname()).toBe('/sign-in'));
    // The email is free again, so the Account is really gone.
    expect((await backend.signUp(plain.email, 'abcdefgh')).status).toBe('signed-in');
  });

  it('asks for the password again when the Sign-in is old', async () => {
    clock += RECENT_SIGN_IN_WINDOW_MS + 1;
    const app = await openAccount();
    await confirmDeletion();
    expect(await screen.findByText(MESSAGES.recentSignInRequired)).toBeVisible();

    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-password');
    await pressButton('Confirm');
    expect(await screen.findByText(MESSAGES.wrongCredentials)).toBeVisible();

    await fireEvent.changeText(screen.getByLabelText('Password'), plain.password);
    await pressButton('Confirm');
    await waitFor(() => expect(app.getPathname()).toBe('/sign-in'));
  });

  it('says the server could not be reached and stays on the Account Screen', async () => {
    jest.spyOn(backend, 'deleteAccount').mockRejectedValue(new Error('offline'));
    const app = await openAccount();
    await confirmDeletion();
    expect(await screen.findByText(MESSAGES.unreachable)).toBeVisible();
    expect(app.getPathname()).toBe('/account');
  });
});

it('asks a Google Account to continue with Google instead of a password', async () => {
  await backend.signInWithProvider(googleIdentity);
  clock += RECENT_SIGN_IN_WINDOW_MS + 1;
  await openAccount('g@example.com', stubProviders({ google: async () => googleIdentity }));
  await confirmDeletion();
  expect(await screen.findByText(MESSAGES.recentSignInRequired)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeOnTheScreen();
  expect(screen.queryByLabelText('Password')).toBeNull();
});
