import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { MESSAGES } from '@/auth/messages';
import { MIN_PASSWORD_LENGTH } from '@/auth/password-rules';
import { validateEmail, validateRequired } from '@/auth/validation';
import { Button } from '@/ui/Button';
import { FormMessage } from '@/ui/FormMessage';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email: string | null; password: string | null }>({
    email: null,
    password: null,
  });
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);

  async function submit() {
    // Only plainly missing input is caught here; the Auth Backend decides what's too weak.
    const next = { email: validateEmail(email), password: validateRequired(password, MESSAGES.passwordRequired) };
    setErrors(next);
    setMessage(null);
    if (next.email || next.password) return;

    const result = await signUp(email, password);
    if (result.status === 'email-in-use') setErrors({ email: MESSAGES.emailInUse, password: null });
    else if (result.status === 'weak-password') setErrors({ email: null, password: MESSAGES.weakPassword });
    else if (result.status === 'confirmation-required') setMessage({ tone: 'info', text: MESSAGES.confirmationRequired });
    else if (result.status === 'unreachable') setMessage({ tone: 'error', text: MESSAGES.unreachable });
    // signed-in: the navigator switches to Home.
  }

  const backToSignIn = () => (router.canGoBack() ? router.back() : router.replace('/sign-in'));

  return (
    <Screen>
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
        helperText={`At least ${MIN_PASSWORD_LENGTH} characters`}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={() => void submit()}
      />
      <Button title="Create account" onPress={submit} />
      <Button title="Back to sign in" variant="link" onPress={backToSignIn} />
    </Screen>
  );
}
