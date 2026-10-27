import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type EnabledSignInMethods = { password: boolean; google: boolean; apple: boolean };

type ConfigExtra = { signInMethods?: Partial<EnabledSignInMethods> } | null | undefined;

// The Sign-in Methods to show, from `signInMethods` in app.config.ts. Apple Sign-in exists
// natively only on iOS, so it is never offered on Android even when switched on.
export function enabledSignInMethods(
  platform: string = Platform.OS,
  extra: ConfigExtra = Constants.expoConfig?.extra,
): EnabledSignInMethods {
  const configured = extra?.signInMethods;
  return {
    password: configured?.password ?? true,
    google: configured?.google ?? false,
    apple: (configured?.apple ?? false) && platform === 'ios',
  };
}
