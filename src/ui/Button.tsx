import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'danger' | 'link';

// When onPress returns a promise, the button ignores further presses until it settles,
// so a quick double tap sends one request.
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  testID,
}: {
  title: string;
  onPress: () => void | Promise<unknown>;
  variant?: Variant;
  disabled?: boolean;
  testID?: string;
}) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const colors = {
    primary: { background: theme.colors.primary, text: theme.colors.onPrimary, border: theme.colors.primary },
    secondary: { background: 'transparent', text: theme.colors.text, border: theme.colors.textMuted },
    danger: { background: theme.colors.danger, text: theme.colors.onDanger, border: theme.colors.danger },
    link: { background: 'transparent', text: theme.colors.link, border: 'transparent' },
  }[variant];

  async function handlePress() {
    if (running.current) return;
    const result = onPress();
    if (!(result instanceof Promise)) return;
    running.current = true;
    setBusy(true);
    try {
      await result;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={() => {
        void handlePress();
      }}
      style={({ pressed }) => ({
        minHeight: theme.minTapTarget,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
      })}
    >
      {busy ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={{ color: colors.text, fontSize: theme.textSizes.body, fontFamily: theme.fonts.medium }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
