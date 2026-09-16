// ESLint flat config (ESLint 9) for the backend.
// CommonJS syntax because backend/package.json has no "type": "module".
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  // Never lint build output or dependencies.
  { ignores: ['dist/**', 'node_modules/**', 'eslint.config.js'] },

  // Core JavaScript recommendations.
  eslint.configs.recommended,

  // TypeScript recommendations (no type-aware rules yet — keeps lint fast).
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Allow intentionally unused args when prefixed with _ (Express error
      // middleware must declare 4 params even if one is unused).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Server-side logging is expected in this project.
      'no-console': 'off',
    },
  },

  // Must stay last: turns off rules that conflict with Prettier formatting.
  prettier
);
