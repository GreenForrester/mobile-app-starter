import * as AppleAuthentication from 'expo-apple-authentication';
import { useColorScheme } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { problemMessage } from '@/auth/messages';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';

// The Google and Apple Sign-in Methods that are switched on. Cancelling is silent;
// a failure is reported through onError.
export function ProviderButtons({ onError }: { onError: (message: string | null) => void }) {
  const { signInMethods, signInWithProvider } = useAuth();
  const theme = useTheme();
  const scheme = useColorScheme();

  async function signIn(provider: 'google' | 'apple') {
    onError(null);
    const problem = problemMessage(await signInWithProvider(provider));
    if (problem) onError(problem);
  }

  return (
    <>
      {signInMethods.google ? (
        <Button title="Continue with Google" variant="secondary" onPress={() => signIn('google')} />
      ) : null}
      {signInMethods.apple ? (
        // Apple requires its own button for Sign in with Apple.
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={theme.radius.md}
          style={{ height: theme.minTapTarget }}
          onPress={() => void signIn('apple')}
        />
      ) : null}
    </>
  );
}
