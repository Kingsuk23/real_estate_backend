import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
  },
  { rules: { 'no-unused-vars': 'warn', 'no-undef': 'warn' } },
  globalIgnores([
    '.config/*',
    '!node_modules/',
    'node_modules/*',
    '!node_modules/mylibrary/',
    'build/**/*',
    '!build/**/*/',
    '!build/test.js',
    '!build/**/test.js',
  ]),
  tseslint.configs.recommended,
  eslintConfigPrettier,
]);
