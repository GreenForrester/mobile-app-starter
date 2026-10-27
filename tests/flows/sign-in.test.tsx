import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { DEMO_ACCOUNTS } from '@/auth/fake/demo-accounts';
import { MESSAGES } from '@/auth/messages';
import type { ProviderIdentity } from '@/auth/types';
import { createTestBackend } from '@/test-utils/auth';
import { renderApp } from '@/test-utils/renderApp';

const { plain, secondFactor } = DEMO_ACCOUNTS;
const googleIdentity: ProviderIdentity = { provider: 'google', subject: 'g-1', idToken: 't', email: 'g@example.com' };

async function fillSignIn(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
}

const pressButton = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

it('opens on the sign-in screen with the demo Accounts listed', async () => {
  const app = await renderApp();
  expect(app.getPathname()).toBe('/sign-in');
  expect(screen.getByText('demo@example.com')).toBeVisible();
});

it('shows field errors and does not call the backend when fields are empty', async () => {
  const backend = createTestBackend();
  const spy = jest.spyOn(backend, 'signInWithPassword');
  await renderApp({ backend });
  await pressButton('Sign in');
  expect(screen.getByText(MESSAGES.emailRequired)).toBeVisible();
  expect(screen.getByText(MESSAGES.passwordRequired)).toBeVisible();
  expect(spy).not.toHaveBeenCalled();
});

it('signs in the demo Account and lands on Home', async () => {
  const app = await renderApp();
  await fillSignIn(plain.email, plain.password);
  await pressButton('Sign in');
  expect(await screen.findByText('Signed in as demo@example.com')).toBeVisible();
  expect(app.getPathname()).toBe('/');
});

it('explains a wrong password and keeps the email', async () => {
  await renderApp();
  await fillSignIn(plain.email, 'wrong-password');
  await pressButton('Sign in');
  expect(await screen.findByText(MESSAGES.wrongCredentials)).toBeVisible();
  expect(screen.getByLabelText('Email')).toHaveDisplayValue(plain.email);
});

it('asks the 2FA demo Account for a Second Factor', async () => {
  const app = await renderApp();
  await fillSignIn(secondFactor.email, secondFactor.password);
  await pressButton('Sign in');
  await waitFor(() => expect(app.getPathname()).toBe('/second-factor'));

  await fireEvent.changeText(screen.getByLabelText('Code'), '000000');
  await pressButton('Verify');
  expect(await screen.findByText(MESSAGES.wrongCode)).toBeVisible();

  await fireEvent.changeText(screen.getByLabelText('Code'), secondFactor.code);
  await pressButton('Verify');
  expect(await screen.findByText('Signed in as demo-2fa@example.com')).toBeVisible();
  expect(app.getPathname()).toBe('/');
});

it('says the server could not be reached when the backend throws', async () => {
  const backend = createTestBackend();
  jest.spyOn(backend, 'signInWithPassword').mockRejectedValue(new Error('offline'));
  await renderApp({ backend });
  await fillSignIn(plain.email, plain.password);
  await pressButton('Sign in');
  expect(await screen.findByText(MESSAGES.unreachable)).toBeVisible();
  expect(screen.getByLabelText('Email')).toHaveDisplayValue(plain.email);
});

it('sends one request when Sign in is tapped twice quickly', async () => {
  const backend = createTestBackend();
  const spy = jest.spyOn(backend, 'signInWithPassword').mockReturnValue(new Promise(() => {}));
  await renderApp({ backend });
  await fillSignIn(plain.email, plain.password);
  await pressButton('Sign in');
  await pressButton('Sign in');
  expect(spy).toHaveBeenCalledTimes(1);
});

it('stays signed in after a restart', async () => {
  const backend = createTestBackend();
  await backend.signInWithPassword(plain.email, plain.password);
  const app = await renderApp({ backend });
  expect(await screen.findByText('Signed in as demo@example.com')).toBeVisible();
  expect(app.getPathname()).toBe('/');
});

it('hides Google until it is switched on', async () => {
  await renderApp();
  expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
});

it('signs in with Google when it is switched on', async () => {
  const app = await renderApp({ signInMethods: { google: true }, providers: { google: async () => googleIdentity } });
  await pressButton('Continue with Google');
  expect(await screen.findByText('Signed in as g@example.com')).toBeVisible();
  expect(app.getPathname()).toBe('/');
});

it('stays on sign-in without an error when Google is cancelled', async () => {
  const app = await renderApp({ signInMethods: { google: true }, providers: { google: async () => null } });
  await pressButton('Continue with Google');
  expect(app.getPathname()).toBe('/sign-in');
  expect(screen.queryByRole('alert')).toBeNull();
});
