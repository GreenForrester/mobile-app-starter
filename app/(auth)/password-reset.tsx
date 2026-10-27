import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { MESSAGES } from '@/auth/messages';
import { validateEmail } from '@/auth/validation';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { FormMessage } from '@/ui/FormMessage';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';

// The answer is the same whether or not an Account exists, so this screen never reveals who has one.
export default function PasswordResetScreen() {
  const { requestPasswordReset } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);

  async function submit() {
    const invalid = validateEmail(email);
    setError(invalid);
    setMessage(null);
    if (invalid) return;

    const result = await requestPasswordReset(email);
    setMessage(
      result.status === 'sent' ? { tone: 'info', text: MESSAGES.resetSent } : { tone: 'error', text: MESSAGES.unreachable },
    );
  }

  const backToSignIn = () => (router.canGoBack() ? router.back() : router.replace('/sign-in'));

  return (
    <Screen>
      <AppText tone="muted">Enter your email and we'll send you a link to set a new password.</AppText>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        onSubmitEditing={() => void submit()}
      />
      <Button title="Send reset link" onPress={submit} />
      <Button title="Back to sign in" variant="link" onPress={backToSignIn} />
    </Screen>
  );
}
