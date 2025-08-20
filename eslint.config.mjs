import { FlatCompat } from '@eslint/eslintrc';
import jsESLint from '@eslint/js';
import typeScriptESLint from '@typescript-eslint/eslint-plugin';
import typeScriptESLintParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import requireAsyncContext from 'eslint-plugin-next-router-async';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactRefresh from 'eslint-plugin-react-refresh';
import tailwindcss from 'eslint-plugin-tailwindcss';
import globals from 'globals';

const compat = new FlatCompat();

export default [
  {
    ignores: [
      'dist',
      'node_modules',
      'eslint.config.mjs',
      'next.config.mjs',
      'vitest.config.mts',
      'tailwind.config.js',
      'postcss.config.cjs',
    ],
  },
  jsESLint.configs.recommended,
  eslintConfigPrettier,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  ...compat.extends(
    'next/core-web-vitals',
    'next/typescript',
    'plugin:jsx-a11y/strict',
    'plugin:storybook/recommended',
    'prettier'
  ),
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typeScriptESLint,
      typeScriptESLintParser,
      jsxA11y,
      prettier,
      react,
      'react-refresh': reactRefresh,
      tailwindcss,
      'next-router-async': requireAsyncContext,
    },
    languageOptions: {
      ecmaVersion: 2023,
      parserOptions: {
        project: ['tsconfig.json'],
        ecmaFeatures: {
          jsx: true,
        },
      },
      parser: typeScriptESLintParser,
      sourceType: 'module',
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        ...globals.browser,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      // ===にしないとエラー
      eqeqeq: 'error',
      // サイクロマティック複雑度が10を超えるとエラー
      complexity: ['error', 15],
      // Any型は警告のとどめて許容する
      '@typescript-eslint/no-explicit-any': 'warn',
      // 未使用変数
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          // アンダースコアで書けば無視
          argsIgnorePattern: '^_',
        },
      ],
      // Childrenの一行タグを許可<Example />
      'react/no-children-prop': 'error',
      // useEffectの依存関係のWarningを無効
      'react-hooks/exhaustive-deps': 'off',
      // JSX に直接コールバック関数の記述を警告
      // NOTE: render ごとに毎回新たな関数実体が生成されre-renderを引き起こすため
      'react/jsx-no-bind': [
        'error',
        {
          // アロー関数のコールバックは許可
          allowArrowFunctions: true,
        },
      ],
      // Componentの複数exportを警告
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // TailwindのカスタムCSSを許可
      'tailwindcss/no-custom-classname': 'off',
      // next15以降のパラメーター非同期を警告
      'next-router-async/enforce-async-params': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
