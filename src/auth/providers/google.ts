import Constants from 'expo-constants';

import type { ProviderSignIn } from '../AuthProvider';

export const signInWithGoogle: ProviderSignIn = async () => {
  // Loaded only when used, so the app still starts where Google isn't set up.
  const { GoogleSignin, isSuccessResponse } =
    require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');

  GoogleSignin.configure({ webClientId: Constants.expoConfig?.extra?.googleWebClientId ?? undefined });
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;

  const { user, idToken } = response.data;
  return { provider: 'google', subject: user.id, idToken: idToken ?? '', email: user.email };
};
