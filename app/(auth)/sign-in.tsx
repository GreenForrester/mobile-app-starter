import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { MESSAGES } from '@/auth/messages';
import { validateEmail, validateRequired } from '@/auth/validation';
import { DemoAccountsHint } from '@/features/auth/DemoAccountsHint';
import { ProviderButtons } from '@/features/auth/ProviderButtons';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { FormMessage } from '@/ui/FormMessage';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';

export default function SignInScreen() {
  const { signInWithPassword, demoAccounts } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email: string | null; password: string | null }>({
    email: null,
    password: null,
  });
  const [formError, setFormError] = useState<string | null>(null);

  async function submit() {
    const next = { email: validateEmail(email), password: validateRequired(password, MESSAGES.passwordRequired) };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;

    const result = await signInWithPassword(email, password);
    if (result.status === 'second-factor-required') {
      router.push({ pathname: '/second-factor', params: { challengeId: result.challengeId } });
    } else if (result.status === 'wrong-credentials') {
      setFormError(MESSAGES.wrongCredentials);
    } else if (result.status === 'unreachable') {
      setFormError(MESSAGES.unreachable);
    }
    // signed-in: the navigator switches to Home.
  }

  return (
    <Screen>
      <AppText tone="muted">Sign in to continue.</AppText>
      {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
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
      <Button title="Sign in" onPress={submit} />
      <ProviderButtons onError={setFormError} />
      <Button title="Forgot password?" variant="link" onPress={() => router.push('/password-reset')} />
      <Button title="Create an account" variant="link" onPress={() => router.push('/sign-up')} />
      {demoAccounts ? <DemoAccountsHint accounts={demoAccounts} /> : null}
    </Screen>
  );
}
