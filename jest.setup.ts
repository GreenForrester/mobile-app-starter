// Fonts can't load under Jest (there is no asset registry), so report every font as loaded.
// This covers both the Theme's fonts and @expo/vector-icons.
jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: jest.fn(() => [true, null]),
}));
