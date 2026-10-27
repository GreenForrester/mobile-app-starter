import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { MESSAGES, problemMessage } from '@/auth/messages';
import { validateEmail, validateRequired } from '@/auth/validation';
import { DemoAccountsHint } from '@/features/auth/DemoAccountsHint';
import { ProviderButtons } from '@/features/auth/ProviderButtons';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { FormMessage } from '@/ui/FormMessage';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';
import { useSubmit } from '@/ui/useSubmit';

type Message = { tone: 'info' | 'error'; text: string };

export default function SignInScreen() {
  const { signInWithPassword, demoAccounts } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email: string | null; password: string | null }>({
    email: null,
    password: null,
  });
  const [message, setMessage] = useState<Message | null>(null);

  const { submit, busy } = useSubmit(async () => {
    const next = { email: validateEmail(email), password: validateRequired(password, MESSAGES.passwordRequired) };
    setErrors(next);
    setMessage(null);
    if (next.email || next.password) return;

    const result = await signInWithPassword(email, password);
    if (result.status === 'second-factor-required') {
      router.push({ pathname: '/second-factor', params: { challengeId: result.challengeId } });
    } else if (result.status === 'wrong-credentials') {
      setMessage({ tone: 'error', text: MESSAGES.wrongCredentials });
    } else if (result.status === 'confirmation-required') {
      setMessage({ tone: 'info', text: MESSAGES.confirmationRequired });
    } else {
      const problem = problemMessage(result);
      if (problem) setMessage({ tone: 'error', text: problem });
    }
    // signed-in: the navigator switches to Home.
  });

  return (
    <Screen>
      <AppText tone="muted">Sign in to continue.</AppText>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={() => void submit()}
      />
      <Button title="Sign in" onPress={submit} busy={busy} />
      <ProviderButtons onError={(text) => setMessage(text ? { tone: 'error', text } : null)} />
      <Button title="Forgot password?" variant="link" onPress={() => router.push('/password-reset')} />
      <Button title="Create an account" variant="link" onPress={() => router.push('/sign-up')} />
      {demoAccounts ? <DemoAccountsHint accounts={demoAccounts} /> : null}
    </Screen>
  );
}
