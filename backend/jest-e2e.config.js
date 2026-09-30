module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testEnvironment: 'node',
  testTimeout: 60000,
  // Must come before the test file: see the comment in setup-e2e-env.ts.
  setupFiles: ['<rootDir>/test/setup-e2e-env.ts'],
};
