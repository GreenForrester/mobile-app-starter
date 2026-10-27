import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

// Opening a pushed screen directly (for example from a deep link) still puts the tabs under it.
export const unstable_settings = { anchor: '(tabs)' };

// The signed-in area: the tabs, plus any screen a Derived App pushes on top of them. Every file
// in app/(app)/ is reachable only while signed in.
export default function SignedInLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: theme.fonts.bold },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
