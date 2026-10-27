import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { authBackend, demoAccounts } from '@/auth/backend';
import { signInWithApple } from '@/auth/providers/apple';
import { signInWithGoogle } from '@/auth/providers/google';
import { enabledSignInMethods } from '@/auth/sign-in-methods';
import { RootNavigator } from '@/navigation/RootNavigator';
import { fontAssets } from '@/theme/fonts';
import { ThemeProvider } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

const providers = { google: signInWithGoogle, apple: signInWithApple };
const signInMethods = enabledSignInMethods();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  // If the fonts fail to load, carry on with the system font rather than a stuck splash.
  const fontsReady = fontsLoaded || fontError !== null;

  return (
    <ThemeProvider>
      <AuthProvider backend={authBackend} providers={providers} signInMethods={signInMethods} demoAccounts={demoAccounts}>
        <StatusBar style="auto" />
        <HideSplashWhenReady fontsReady={fontsReady} />
        {fontsReady ? <RootNavigator /> : null}
      </AuthProvider>
    </ThemeProvider>
  );
}

function HideSplashWhenReady({ fontsReady }: { fontsReady: boolean }) {
  const { state } = useAuth();
  const ready = fontsReady && state.status !== 'loading';
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
  return null;
}
