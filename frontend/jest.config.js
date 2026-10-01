const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Typing into the five-field sign-up form is genuinely slow under jsdom.
  testTimeout: 20000,
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  // Stated explicitly rather than left to next/jest: without it, `jest.mock`
  // cannot resolve an aliased path even though a plain import of the same path
  // works, and the failure surfaces as "cannot find module" pointing at the
  // mock rather than at the config.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: ['features/auth/**/*.{ts,tsx}', 'lib/i18n/**/*.ts'],
};

module.exports = createJestConfig(customJestConfig);
