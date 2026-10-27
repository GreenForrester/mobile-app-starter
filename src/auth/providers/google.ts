import Constants from 'expo-constants';

import type { ProviderSignIn } from '../AuthProvider';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

// Loaded only when used, so the app still starts where Google isn't set up.
function loadGoogleSignIn(): GoogleSignInModule {
  const google = require('@react-native-google-signin/google-signin') as GoogleSignInModule;
  const extra = Constants.expoConfig?.extra;
  google.GoogleSignin.configure({
    webClientId: extra?.googleWebClientId ?? undefined,
    // iOS needs its own client ID; app.config.ts works it out from GOOGLE_IOS_URL_SCHEME.
    iosClientId: extra?.googleIosClientId ?? undefined,
  });
  return google;
}

export const signInWithGoogle: ProviderSignIn = Object.assign(
  async () => {
    const { GoogleSignin, isSuccessResponse } = loadGoogleSignIn();
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;

    const { user, idToken } = response.data;
    return { provider: 'google' as const, subject: user.id, idToken: idToken ?? '', email: user.email };
  },
  {
    // Without this, the next "Continue with Google" reuses the same Google account silently.
    signOut: async () => {
      await loadGoogleSignIn().GoogleSignin.signOut();
    },
  },
);
