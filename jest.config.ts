import type { Config } from 'jest';

process.env.TZ = 'UTC'; // Corremos los tests en UTC para evitar problemas con las fechas

const baseCoverageExclusions = [
  '!**/*.module.ts',
  '!main.ts',
  '!**/*.dto.ts',
  '!**/*.schema.ts',
  '!**/*.entity.ts',
  '!**/*.enum.ts',
  '!**/*.interface.ts',
  '!**/*.decorator.ts',
  '!**/*.interceptor.ts',
  '!**/*.middleware.ts',
  '!**/*.config.ts',
  '!**/*.store.ts',
  '!**/*base*.service.ts', // Excluir clases base abstractas
  '!**/index.ts',
];

const config: Config = {
  cache: true,
  verbose: !!process.env.CI,
  clearMocks: true,
  testTimeout: 5000,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  rootDir: './src',
  maxWorkers: process.env.CI ? '90%' : '50%',
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  collectCoverage: true,
  collectCoverageFrom: ['**/*.ts', ...baseCoverageExclusions],
  coverageProvider: 'babel',
  coveragePathIgnorePatterns: [
    '.module.ts',
    'main.ts',
    '.dto.ts',
    '.enum.ts',
    '.schema.ts',
    '.entity.ts',
    '.config.ts',
    '.store.ts',
    '.middleware.ts',
    'index.ts',
  ],
  coverageDirectory: '../coverage',
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
  coverageReporters: [
    [
      'text',
      {
        skipFull: true,
      },
    ],
    'text-summary',
    'json-summary',
  ],
};

export default config;
