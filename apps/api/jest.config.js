/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.json', isolatedModules: true, diagnostics: false }],
  },
  moduleNameMapper: {
    '^@loyalty/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@loyalty/utils$': '<rootDir>/../../packages/utils/src/index.ts',
    '^@loyalty/db$': '<rootDir>/../../packages/db/src/index.ts',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
};
