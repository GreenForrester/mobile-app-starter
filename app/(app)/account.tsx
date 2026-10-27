import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { MESSAGES } from '@/auth/messages';
import { ReauthPrompt } from '@/features/account/ReauthPrompt';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { FormMessage } from '@/ui/FormMessage';
import { Screen } from '@/ui/Screen';

type DeletionStep = 'idle' | 'confirm' | 'reauthenticate';

export default function AccountScreen() {
  const { state, signOut, deleteAccount } = useAuth();
  const theme = useTheme();
  const [step, setStep] = useState<DeletionStep>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const account = state.status === 'signed-in' ? state.session.account : null;

  async function deleteNow() {
    setFormError(null);
    const result = await deleteAccount();
    if (result.status === 'recent-sign-in-required') setStep('reauthenticate');
    else if (result.status === 'unreachable') setFormError(MESSAGES.unreachable);
    // deleted: the navigator switches to Sign-in.
  }

  const panel = {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.surface,
  };

  return (
    <Screen>
      <AppText variant="heading">{`Signed in as ${account?.email ?? ''}`}</AppText>
      {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
      <Button title="Sign out" variant="secondary" onPress={signOut} />

      {step === 'idle' ? (
        <Button title="Delete account" variant="secondary" onPress={() => setStep('confirm')} />
      ) : null}

      {step === 'confirm' ? (
        <View style={panel}>
          <AppText>{MESSAGES.deleteConfirm}</AppText>
          <Button title="Delete account" variant="danger" onPress={deleteNow} />
          <Button title="Cancel" variant="secondary" onPress={() => setStep('idle')} />
        </View>
      ) : null}

      {step === 'reauthenticate' && account ? (
        <View style={panel}>
          <AppText>{MESSAGES.recentSignInRequired}</AppText>
          <ReauthPrompt method={account.method} onConfirmed={deleteNow} />
          <Button title="Cancel" variant="secondary" onPress={() => setStep('idle')} />
        </View>
      ) : null}
    </Screen>
  );
}
