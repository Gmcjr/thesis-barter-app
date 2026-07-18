import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends('airbnb', 'airbnb/hooks'),
  ...compat.env({
    browser: true,
    node: true,
  }),
  ...compat.plugins('react', 'jsx-a11y'),
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
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