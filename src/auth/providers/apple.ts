import * as AppleAuthentication from 'expo-apple-authentication';

import type { ProviderSignIn } from '../AuthProvider';

export const signInWithApple: ProviderSignIn = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    // Apple sends the email only on the first Sign-in.
    return { provider: 'apple', subject: credential.user, idToken: credential.identityToken ?? '', email: credential.email };
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw error;
  }
};
