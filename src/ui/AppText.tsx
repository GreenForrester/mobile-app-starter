import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'title' | 'heading' | 'body' | 'small';
type Tone = 'default' | 'muted' | 'danger' | 'link';

export function AppText({
  variant = 'body',
  tone = 'default',
  style,
  ...props
}: TextProps & { variant?: Variant; tone?: Tone }) {
  const theme = useTheme();
  const size = theme.textSizes[variant];
  const isHeading = variant === 'title' || variant === 'heading';
  const color = {
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    danger: theme.colors.danger,
    link: theme.colors.link,
  }[tone];

  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      {...props}
      style={[
        {
          color,
          fontSize: size,
          lineHeight: Math.round(size * 1.4),
          fontFamily: isHeading ? theme.fonts.bold : theme.fonts.regular,
        },
        style,
      ]}
    />
  );
}
