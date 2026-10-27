import { View } from 'react-native';

import type { DemoAccounts } from '@/auth/fake/demo-accounts';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from '@/ui/AppText';

// Shown only while the Fake Auth Backend is active, so anyone can sign in straight away.
export function DemoAccountsHint({ accounts }: { accounts: DemoAccounts }) {
  const theme = useTheme();
  const { plain, secondFactor } = accounts;
  return (
    <View
      style={{
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <AppText variant="small" tone="muted">
        Demo accounts (Fake Auth Backend)
      </AppText>
      <View>
        <AppText selectable>{plain.email}</AppText>
        <AppText variant="small" tone="muted" selectable>
          {`Password: ${plain.password}`}
        </AppText>
      </View>
      <View>
        <AppText selectable>{secondFactor.email}</AppText>
        <AppText variant="small" tone="muted" selectable>
          {`Password: ${secondFactor.password} · Code: ${secondFactor.code}`}
        </AppText>
      </View>
    </View>
  );
}
