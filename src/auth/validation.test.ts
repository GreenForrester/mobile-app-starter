import { MESSAGES } from './messages';
import { validateEmail, validateRequired } from './validation';

it('asks for an email when it is empty', () => {
  expect(validateEmail('')).toBe(MESSAGES.emailRequired);
  expect(validateEmail('   ')).toBe(MESSAGES.emailRequired);
});

it('rejects something that is not an email address', () => {
  expect(validateEmail('demo')).toBe(MESSAGES.emailInvalid);
});

it('accepts an email address with surrounding spaces', () => {
  expect(validateEmail(' demo@example.com ')).toBeNull();
});

it('asks for a required value', () => {
  expect(validateRequired('', MESSAGES.passwordRequired)).toBe(MESSAGES.passwordRequired);
  expect(validateRequired('Password123!', MESSAGES.passwordRequired)).toBeNull();
});
