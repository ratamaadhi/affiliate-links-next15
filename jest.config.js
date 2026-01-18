const nextJest = require('next/jest');

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uncrypto$': '<rootDir>/node_modules/uncrypto/dist/crypto.web.cjs',
    '^jose/(.*)$': '<rootDir>/__mocks__/jose.js',
  },
  testMatch: ['<rootDir>/__test__/**/*.{js,jsx,ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!nanostores|better-auth|better-call|uncrypto|@better-auth|resend|@dnd-kit|motion|vaul|cmdk|slug|jose|nanoid)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'mjs'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config);
