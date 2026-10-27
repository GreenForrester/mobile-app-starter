import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { MESSAGES } from '@/auth/messages';
import type { SignInMethod } from '@/auth/types';
import { validateRequired } from '@/auth/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { FormMessage } from '@/ui/FormMessage';
import { TextField } from '@/ui/TextField';

// Asks a signed-in person to prove who they are again, the same way they signed in.
export function ReauthPrompt({ method, onConfirmed }: { method: SignInMethod; onConfirmed: () => Promise<void> }) {
  const { reauthenticate } = useAuth();
  const theme = useTheme();
  const scheme = useColorScheme();
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function confirm(proof: { kind: 'password'; password: string } | { kind: 'provider' }) {
    setFieldError(null);
    setFormError(null);
    const result = await reauthenticate(proof);
    if (result.status === 'signed-in') await onConfirmed();
    else if (result.status === 'wrong-credentials') setFieldError(MESSAGES.wrongCredentials);
    else if (result.status === 'unreachable') setFormError(MESSAGES.unreachable);
    // cancelled: the person closed the Google or Apple sheet; nothing to say.
  }

  async function confirmPassword() {
    const missing = validateRequired(password, MESSAGES.passwordRequired);
    if (missing) {
      setFieldError(missing);
      return;
    }
    await confirm({ kind: 'password', password });
  }

  return (
    <>
      {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
      {method === 'password' ? (
        <>
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={fieldError}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={() => void confirmPassword()}
          />
          <Button title="Confirm" onPress={confirmPassword} />
        </>
      ) : method === 'apple' ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={theme.radius.md}
          style={{ height: theme.minTapTarget }}
          onPress={() => void confirm({ kind: 'provider' })}
        />
      ) : (
        <Button title="Continue with Google" variant="secondary" onPress={() => confirm({ kind: 'provider' })} />
      )}
    </>
  );
}
