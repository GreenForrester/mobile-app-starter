module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // The Derived App end-to-end test is slow; it runs only through `npm run test:new-app`.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/', '<rootDir>/.superpowers/', '\\.e2e\\.test\\.js$'],
  modulePathIgnorePatterns: ['<rootDir>/.superpowers/'],
};
