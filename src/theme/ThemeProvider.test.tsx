import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { darkTheme, lightTheme } from './theme';
import { ThemeProvider, useTheme } from './ThemeProvider';

it.each([
  ['dark', darkTheme],
  ['light', lightTheme],
  [null, lightTheme],
] as const)('scheme %s gives the matching Theme', async (scheme, expected) => {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme);
  const { result } = await renderHook(() => useTheme(), { wrapper: ThemeProvider });
  expect(result.current).toBe(expected);
});
