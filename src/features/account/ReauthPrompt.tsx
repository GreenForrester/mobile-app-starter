import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { MESSAGES, problemMessage } from '@/auth/messages';
import type { SignInMethod } from '@/auth/types';
import { validateRequired } from '@/auth/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { FormMessage } from '@/ui/FormMessage';
import { TextField } from '@/ui/TextField';
import { useSubmit } from '@/ui/useSubmit';

// Asks a signed-in person to prove who they are again, the same way they signed in,
// including their Second Factor when the Auth Backend asks for it.
export function ReauthPrompt({ method, onConfirmed }: { method: SignInMethod; onConfirmed: () => Promise<void> }) {
  const { reauthenticate, submitSecondFactor } = useAuth();
  const theme = useTheme();
  const scheme = useColorScheme();
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function confirm(proof: { kind: 'password'; password: string } | { kind: 'provider' }) {
    setFieldError(null);
    setFormError(null);
    const result = await reauthenticate(proof);
    if (result.status === 'signed-in') await onConfirmed();
    else if (result.status === 'second-factor-required') setChallengeId(result.challengeId);
    else if (result.status === 'wrong-credentials') setFieldError(MESSAGES.wrongCredentials);
    else setFormError(problemMessage(result));
    // cancelled: the person closed the Google or Apple sheet; nothing to say.
  }

  const passwordStep = useSubmit(async () => {
    const missing = validateRequired(password, MESSAGES.passwordRequired);
    if (missing) {
      setFieldError(missing);
      return;
    }
    await confirm({ kind: 'password', password });
  });

  const codeStep = useSubmit(async () => {
    const missing = validateRequired(code, MESSAGES.codeRequired);
    setFieldError(missing);
    setFormError(null);
    if (missing || !challengeId) return;
    const result = await submitSecondFactor(challengeId, code);
    if (result.status === 'signed-in') await onConfirmed();
    else if (result.status === 'wrong-code') setFieldError(MESSAGES.wrongCode);
    else setFormError(problemMessage(result));
  });

  return (
    <>
      {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
      {challengeId ? (
        <>
          <TextField
            label="Code"
            value={code}
            onChangeText={setCode}
            error={fieldError}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            onSubmitEditing={() => void codeStep.submit()}
          />
          <Button title="Verify" onPress={codeStep.submit} busy={codeStep.busy} />
        </>
      ) : method === 'password' ? (
        <>
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={fieldError}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={() => void passwordStep.submit()}
          />
          <Button title="Confirm" onPress={passwordStep.submit} busy={passwordStep.busy} />
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
