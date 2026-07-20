import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends(
    'airbnb',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended'
  ),
  ...compat.env({
    browser: true,
    node: true,
  }),
  ...compat.plugins('react', 'jsx-a11y'),
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    }
  },
  {
    rules: {
      'linebreak-style': 'off',
      'react/function-component-definition': 'off',
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      'no-underscore-dangle': ['error', { allow: ['__filename', '__dirname', '_id'] }],
      'consistent-return': 'warn',
      'import/no-extraneous-dependencies': 'off',
    },
  },
];