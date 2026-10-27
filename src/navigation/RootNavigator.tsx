import { Stack } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';

// Signed-in people see the (app) tabs; everyone else sees the (auth) screens.
export function RootNavigator() {
  const { state } = useAuth();
  const theme = useTheme();
  if (state.status === 'loading') return null;
  const signedIn = state.status === 'signed-in';

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Protected guard={signedIn} redirectTo="/sign-in">
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn} redirectTo="/">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
