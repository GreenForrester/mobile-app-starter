import { buildConfig } from './app.config';

const base = { name: '', slug: '' };
const identity = require('./app-identity.json');
const off = { password: true, google: false, apple: false };

// Assert against app-identity.json, never literals: this test is copied into every Derived App.
it('applies the App Identity', () => {
  const c = buildConfig(base, { identity, signInMethods: off, env: {} });
  expect([c.name, c.slug, c.scheme]).toEqual([identity.name, identity.slug, identity.scheme]);
  expect(c.ios?.bundleIdentifier).toBe(identity.iosBundleId);
  expect(c.android?.package).toBe(identity.androidPackage);
  expect(c.userInterfaceStyle).toBe('automatic');
  expect(c.extra).toEqual({ signInMethods: off, googleWebClientId: null });
});

it('refuses Google without keys', () => {
  expect(() => buildConfig(base, { identity, signInMethods: { ...off, google: true }, env: {} })).toThrow(
    /EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID/,
  );
});

it('adds the Google plugin and client ID when keys are present', () => {
  const env = { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-id', GOOGLE_IOS_URL_SCHEME: 'com.googleusercontent.apps.x' };
  const c = buildConfig(base, { identity, signInMethods: { ...off, google: true }, env });
  expect(c.plugins).toContainEqual([
    '@react-native-google-signin/google-signin',
    { iosUrlScheme: 'com.googleusercontent.apps.x' },
  ]);
  expect(c.extra?.googleWebClientId).toBe('web-id');
});

it('switches on Apple', () => {
  const c = buildConfig(base, { identity, signInMethods: { ...off, apple: true }, env: {} });
  expect(c.ios?.usesAppleSignIn).toBe(true);
  expect(c.plugins).toContain('expo-apple-authentication');
});
