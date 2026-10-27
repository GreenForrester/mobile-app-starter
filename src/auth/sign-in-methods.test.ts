import { enabledSignInMethods } from './sign-in-methods';

const allOn = { signInMethods: { password: true, google: true, apple: true } };

it('never offers Apple on Android', () => {
  expect(enabledSignInMethods('android', allOn)).toEqual({ password: true, google: true, apple: false });
});

it('offers Apple on iOS when it is switched on', () => {
  expect(enabledSignInMethods('ios', allOn)).toEqual({ password: true, google: true, apple: true });
});

it('falls back to Password Sign-in only when there is no config', () => {
  expect(enabledSignInMethods('android', null)).toEqual({ password: true, google: false, apple: false });
});
