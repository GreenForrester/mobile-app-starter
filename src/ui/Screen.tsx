import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

// Every screen's outer frame. The navigation header and tab bar handle the top and bottom
// safe areas; the extra bottom padding keeps the last control clear of the home indicator.
export function Screen({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.lg + insets.bottom,
          paddingLeft: theme.spacing.lg + insets.left,
          paddingRight: theme.spacing.lg + insets.right,
          gap: theme.spacing.md,
        }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
