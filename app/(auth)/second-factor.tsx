import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { MESSAGES } from '@/auth/messages';
import { validateRequired } from '@/auth/validation';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { FormMessage } from '@/ui/FormMessage';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';

// Shown when the Auth Backend asks for a Second Factor after a correct password.
export default function SecondFactorScreen() {
  const { submitSecondFactor } = useAuth();
  const router = useRouter();
  const { challengeId = '' } = useLocalSearchParams<{ challengeId?: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit() {
    const missing = validateRequired(code, MESSAGES.codeRequired);
    setError(missing);
    setFormError(null);
    if (missing) return;

    const result = await submitSecondFactor(challengeId, code);
    if (result.status === 'wrong-code') setError(MESSAGES.wrongCode);
    else if (result.status === 'unreachable') setFormError(MESSAGES.unreachable);
    // signed-in: the navigator switches to Home.
  }

  return (
    <Screen>
      <AppText tone="muted">Enter your verification code to finish signing in.</AppText>
      {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
      <TextField
        label="Code"
        value={code}
        onChangeText={setCode}
        error={error}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        onSubmitEditing={() => void submit()}
      />
      <Button title="Verify" onPress={submit} />
      <Button title="Back to sign in" variant="link" onPress={() => router.back()} />
    </Screen>
  );
}
