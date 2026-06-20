const maxLineLength = 120;

import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import unusedImports from 'eslint-plugin-unused-imports';
import jestPlugin from 'eslint-plugin-jest';
import sonarjsPlugin from 'eslint-plugin-sonarjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compatibility wrapper for extending legacy configurations
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['node_modules', 'dist', 'coverage', 'eslint.config.mjs'],
  },
  // Extensión de configuraciones para TypeScript
  ...compat.extends(
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:jest/recommended',
    'plugin:sonarjs/recommended-legacy',
    'eslint:recommended',
  ),
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      'unused-imports': unusedImports,
      jest: jestPlugin,
      sonarjs: sonarjsPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        Express: 'readonly',
      },
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      'no-console': 'error', // Prohibir console.log en archivos TypeScript
      'no-unused-vars': 'off', // Deshabilitamos la regla base de JS para usar la de TypeScript
      'prettier/prettier': 'error',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
        },
      ],
      'sonarjs/todo-tag': 'warn',
      'sonarjs/no-ignored-exceptions': 'warn',
      'sonarjs/deprecation': 'warn',
      '@typescript-eslint/no-unused-vars': 'off', // Deshabilitamos para usar unused-imports
      'sonarjs/cognitive-complexity': ['warn', 15],
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'max-len': [
        'error',
        {
          tabWidth: 2,
          code: maxLineLength,
          ignoreStrings: true,
          ignoreComments: true,
          ignoreTemplateLiterals: true,
          ignoreUrls: true,
        },
      ],
    },
  },
  {
    // Excepción específica para main.ts - permitir console (bootstrap / logs de arranque)
    files: ['src/main.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Overrides para archivos de test y mocks
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/*.mock.ts', '**/__mocks__/**/*.ts'],
    rules: {
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'max-lines': ['error', 3999],
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/no-hardcoded-ip': 'off',
      'sonarjs/function-return-type': 'off',
      'sonarjs/no-undefined-argument': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/publicly-writable-directories': 'off',
    },
  },
];
