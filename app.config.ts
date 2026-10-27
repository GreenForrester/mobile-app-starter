import type { ConfigContext, ExpoConfig } from 'expo/config';

import identity from './app-identity.json';

export type AppIdentity = {
  name: string;
  slug: string;
  scheme: string;
  iosBundleId: string;
  androidPackage: string;
};

export type SignInMethodsConfig = { password: boolean; google: boolean; apple: boolean };

// Sign-in Methods this app offers. A Derived App switches on Google or Apple here,
// after adding its own keys to .env.local (see README: "Switching on Google or Apple").
export const signInMethods: SignInMethodsConfig = { password: true, google: false, apple: false };

const GOOGLE_ENV = ['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'GOOGLE_IOS_URL_SCHEME'] as const;

export function buildConfig(
  base: ExpoConfig,
  options: { identity: AppIdentity; signInMethods: SignInMethodsConfig; env: Record<string, string | undefined> },
): ExpoConfig {
  const { identity, signInMethods, env } = options;

  if (signInMethods.google) {
    const missing = GOOGLE_ENV.filter((name) => !env[name]);
    if (missing.length > 0) {
      throw new Error(
        `Google sign-in is switched on in app.config.ts, but .env.local is missing: ${missing.join(', ')}`,
      );
    }
  }

  const plugins: ExpoConfig['plugins'] = [
    'expo-router',
    'expo-status-bar',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F8FAFC',
        dark: { backgroundColor: '#020617' },
      },
    ],
  ];
  if (signInMethods.apple) plugins.push('expo-apple-authentication');
  if (signInMethods.google) {
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: env.GOOGLE_IOS_URL_SCHEME }]);
  }

  return {
    ...base,
    name: identity.name,
    slug: identity.slug,
    scheme: identity.scheme,
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      ...base.ios,
      supportsTablet: true,
      bundleIdentifier: identity.iosBundleId,
      usesAppleSignIn: signInMethods.apple,
    },
    android: {
      ...base.android,
      package: identity.androidPackage,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: { favicon: './assets/favicon.png' },
    plugins,
    extra: {
      ...base.extra,
      signInMethods,
      googleWebClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? null,
    },
  };
}

export default ({ config }: ConfigContext): ExpoConfig =>
  buildConfig(config as ExpoConfig, { identity, signInMethods, env: process.env });
