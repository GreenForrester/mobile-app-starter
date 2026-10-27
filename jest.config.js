module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // The Starter's slow Derived App end-to-end test runs only through its own `npm run test:new-app`.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/', '<rootDir>/.superpowers/', '\\.e2e\\.test\\.js$'],
  modulePathIgnorePatterns: ['<rootDir>/.superpowers/'],
};
