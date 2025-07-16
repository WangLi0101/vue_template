// eslint.config.js
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';
import eslintPluginVue from 'eslint-plugin-vue';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // 1. Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      'coverage/**',
      '.husky/**',
    ],
  },

  // 2. Base configuration for all linted files
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      vue: eslintPluginVue,
    },
  },

  // 3. Parser and rule configuration for TS files
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      // A few safe, basic rules. NO PRESETS.
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // 4. Parser and rule configuration for Vue files
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser, // Use TS parser for <script>
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      // A few safe, basic Vue rules. NO PRESETS.
      'vue/multi-word-component-names': 'warn',
      'vue/no-mutating-props': 'warn',
      'vue/no-dupe-keys': 'error',
    },
  },

  // 5. Prettier config must be last to disable conflicting formatting rules
  eslintConfigPrettier,
];
