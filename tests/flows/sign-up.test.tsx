import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { MESSAGES } from '@/auth/messages';
import { MIN_PASSWORD_LENGTH } from '@/auth/password-rules';
import { createTestBackend } from '@/test-utils/auth';
import { renderApp } from '@/test-utils/renderApp';

const pressButton = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

async function signUp(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
  await pressButton('Create account');
}

it('opens Sign-up from Sign-in', async () => {
  const app = await renderApp();
  await pressButton('Create an account');
  await waitFor(() => expect(app.getPathname()).toBe('/sign-up'));
  expect(screen.getByText(`At least ${MIN_PASSWORD_LENGTH} characters`)).toBeVisible();
});

it('creates an Account and lands on Home', async () => {
  const app = await renderApp({ initialUrl: '/sign-up' });
  await signUp('new@example.com', 'abcdefgh');
  expect(await screen.findByText('Signed in as new@example.com')).toBeVisible();
  expect(app.getPathname()).toBe('/');
});

it('shows "already exists" next to Email for an email in use, whatever its case', async () => {
  await renderApp({ initialUrl: '/sign-up' });
  await signUp('Demo@Example.com', 'abcdefgh');
  expect(await screen.findByText(MESSAGES.emailInUse)).toBeVisible();
  expect(screen.getByLabelText('Email').props.accessibilityHint).toBe(MESSAGES.emailInUse);
});

it('shows the password rule next to Password when the backend says it is too weak', async () => {
  await renderApp({ initialUrl: '/sign-up' });
  await signUp('x@example.com', 'abcdefg');
  expect(await screen.findByText(MESSAGES.weakPassword)).toBeVisible();
  expect(screen.getByLabelText('Password').props.accessibilityHint).toBe(MESSAGES.weakPassword);
});

it('asks the person to confirm their email when the backend requires it', async () => {
  const backend = createTestBackend();
  jest.spyOn(backend, 'signUp').mockResolvedValue({ status: 'confirmation-required' });
  const app = await renderApp({ backend, initialUrl: '/sign-up' });
  await signUp('new@example.com', 'abcdefgh');
  expect(await screen.findByText(MESSAGES.confirmationRequired)).toBeVisible();
  expect(app.getPathname()).toBe('/sign-up');

  await pressButton('Back to sign in');
  await waitFor(() => expect(app.getPathname()).toBe('/sign-in'));
});
