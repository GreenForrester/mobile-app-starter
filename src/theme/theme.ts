import { fontFamilies } from './fonts';

// The one Theme every screen takes its look from (ADR 0002). A Derived App gets its
// look by replacing these values with ones extracted from its Reference Design.
export type Theme = {
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
    onPrimary: string;
    link: string;
    border: string;
    danger: string;
    onDanger: string;
    focus: string;
  };
  fonts: { regular: string; medium: string; bold: string };
  textSizes: { small: number; body: number; heading: number; title: number };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  radius: { sm: number; md: number };
  minTapTarget: number;
};

const shared = {
  fonts: fontFamilies,
  textSizes: { small: 14, body: 16, heading: 20, title: 28 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 6, md: 10 },
  minTapTarget: 44,
};

export const lightTheme: Theme = {
  ...shared,
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#020617',
    textMuted: '#475569',
    primary: '#0F172A',
    onPrimary: '#FFFFFF',
    link: '#1E3A8A',
    border: '#E2E8F0',
    danger: '#DC2626',
    onDanger: '#FFFFFF',
    focus: '#0F172A',
  },
};

export const darkTheme: Theme = {
  ...shared,
  colors: {
    background: '#020617',
    surface: '#0F172A',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    primary: '#E2E8F0',
    onPrimary: '#0F172A',
    link: '#93C5FD',
    border: '#1E293B',
    danger: '#F87171',
    onDanger: '#020617',
    focus: '#E2E8F0',
  },
};
