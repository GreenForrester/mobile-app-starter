/**
 * @jest-environment node
 */
import path from 'path';

import { findRawStyleValues, scanForRawStyleValues } from '@/test-utils/raw-style-values';

it.each([
  "color: '#0F172A'",
  "backgroundColor: 'rgba(0, 0, 0, 0.5)'",
  'fontSize: 16',
  "fontFamily: 'IBMPlexSans_400Regular'",
  'marginTop: 8',
  'paddingHorizontal: 24',
  'gap: 12',
  'borderRadius: 6',
])('flags a raw style value: %s', (line) => {
  expect(scanForRawStyleValues(line)).toEqual([line]);
});

it.each(['padding: theme.spacing.lg', 'margin: 0', 'color: theme.colors.text', "title: 'Sign in'"])(
  'allows %s',
  (line) => {
    expect(scanForRawStyleValues(line)).toEqual([]);
  },
);

it('screens use only Theme values', () => {
  expect(findRawStyleValues(path.resolve(__dirname, '../..'))).toEqual([]);
});
