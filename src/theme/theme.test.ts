import { contrastRatio } from './contrast';
import { darkTheme, lightTheme } from './theme';

it('measures contrast', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  expect(contrastRatio('#777777', '#FFFFFF')).toBeLessThan(4.5);
});

const pairs = [
  ['text', 'background'],
  ['text', 'surface'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['onPrimary', 'primary'],
  ['onDanger', 'danger'],
  ['link', 'background'],
  ['danger', 'background'],
  ['danger', 'surface'],
] as const;

it.each([
  ['light', lightTheme],
  ['dark', darkTheme],
])('%s theme text is readable', (_, theme) => {
  const unreadable = pairs
    .map(([fg, bg]) => ({ pair: `${fg} on ${bg}`, ratio: contrastRatio(theme.colors[fg], theme.colors[bg]) }))
    .filter(({ ratio }) => ratio < 4.5);
  expect(unreadable).toEqual([]);
});

it('light and dark have the same shape', () => {
  expect(Object.keys(darkTheme.colors).sort()).toEqual(Object.keys(lightTheme.colors).sort());
  expect(lightTheme.minTapTarget).toBe(44);
  expect(darkTheme.minTapTarget).toBe(44);
});
