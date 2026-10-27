import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

// A labeled input. Its error, or else its helper text, sits directly below it.
export function TextField({
  label,
  error,
  helperText,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: TextInputProps & { label: string; error?: string | null; helperText?: string }) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const note = error ?? helperText;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <AppText variant="small" style={{ fontFamily: theme.fonts.medium }}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={note ?? undefined}
        placeholderTextColor={theme.colors.textMuted}
        {...inputProps}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          {
            minHeight: theme.minTapTarget,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.sm,
            borderWidth: 1,
            borderColor: error ? theme.colors.danger : focused ? theme.colors.focus : theme.colors.textMuted,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            fontSize: theme.textSizes.body,
            fontFamily: theme.fonts.regular,
          },
          style,
        ]}
      />
      {note ? (
        <AppText variant="small" tone={error ? 'danger' : 'muted'}>
          {note}
        </AppText>
      ) : null}
    </View>
  );
}
