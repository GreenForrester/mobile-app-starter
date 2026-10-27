import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { MESSAGES } from '@/auth/messages';
import { createTestBackend } from '@/test-utils/auth';
import { renderApp } from '@/test-utils/renderApp';

const pressButton = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

it('opens Password Reset from Sign-in', async () => {
  const app = await renderApp();
  await pressButton('Forgot password?');
  await waitFor(() => expect(app.getPathname()).toBe('/password-reset'));
});

it.each(['demo@example.com', 'nobody@example.com'])(
  'gives the same answer for %s, so it never reveals who has an Account',
  async (email) => {
    await renderApp({ initialUrl: '/password-reset' });
    await fireEvent.changeText(screen.getByLabelText('Email'), email);
    await pressButton('Send reset link');
    expect(await screen.findByText(MESSAGES.resetSent)).toBeVisible();
  },
);

it('asks for an email and does not call the backend when it is empty', async () => {
  const backend = createTestBackend();
  const spy = jest.spyOn(backend, 'requestPasswordReset');
  await renderApp({ backend, initialUrl: '/password-reset' });
  await pressButton('Send reset link');
  expect(screen.getByText(MESSAGES.emailRequired)).toBeVisible();
  expect(spy).not.toHaveBeenCalled();
});

it('goes back to Sign-in after sending', async () => {
  const app = await renderApp();
  await pressButton('Forgot password?');
  await waitFor(() => expect(app.getPathname()).toBe('/password-reset'));
  await fireEvent.changeText(screen.getByLabelText('Email'), 'demo@example.com');
  await pressButton('Send reset link');
  await screen.findByText(MESSAGES.resetSent);
  await pressButton('Back to sign in');
  await waitFor(() => expect(app.getPathname()).toBe('/sign-in'));
});

it('sends one reset email when the keyboard submits and the button is tapped too', async () => {
  const backend = createTestBackend();
  const spy = jest.spyOn(backend, 'requestPasswordReset').mockReturnValue(new Promise(() => {}));
  await renderApp({ backend, initialUrl: '/password-reset' });
  await fireEvent.changeText(screen.getByLabelText('Email'), 'demo@example.com');
  await fireEvent(screen.getByLabelText('Email'), 'submitEditing');
  await pressButton('Send reset link');
  expect(spy).toHaveBeenCalledTimes(1);
});
