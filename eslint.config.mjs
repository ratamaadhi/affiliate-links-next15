import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    'next/core-web-vitals',
    'plugin:prettier/recommended',
    'prettier'
  ),
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'prettier/prettier': ['error'],
      'no-unused-vars': [1, { args: 'after-used', argsIgnorePattern: '^_' }],
      'react/prop-types': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-filename-extension': 'off',
      'react/no-unknown-property': 'off',
      'no-nested-ternary': 'off',
    },
  },
];

export default eslintConfig;
