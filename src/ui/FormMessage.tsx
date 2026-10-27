import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

// A message about the whole form, announced to screen readers when it appears.
export function FormMessage({ tone, children }: { tone: 'info' | 'error'; children: string }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: tone === 'error' ? theme.colors.danger : theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <AppText tone={tone === 'error' ? 'danger' : 'default'}>{children}</AppText>
    </View>
  );
}
