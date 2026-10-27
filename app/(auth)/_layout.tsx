import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

// Where signed-out people land, including when a protected route like "/" sends them here.
export const unstable_settings = { anchor: 'sign-in' };

// The signed-out screens.
export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: theme.fonts.bold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
      <Stack.Screen name="second-factor" options={{ title: 'Verification code' }} />
    </Stack>
  );
}
