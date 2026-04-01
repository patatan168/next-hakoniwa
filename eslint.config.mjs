import { FlatCompat } from '@eslint/eslintrc';
import jsESLint from '@eslint/js';
import typeScriptESLintParser from '@typescript-eslint/parser';
import nextVitals from 'eslint-config-next/core-web-vitals';
import eslintConfigPrettier from 'eslint-config-prettier';
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
      '.stylelintrc.mjs',
      'dist',
      'node_modules',
      'eslint.config.mjs',
      'next.config.mjs',
      'next-env.d.ts',
      'vitest.config.mts',
      'tailwind.config.js',
      'postcss.config.cjs',
    ],
  },
  ...nextVitals,
  jsESLint.configs.recommended,
  eslintConfigPrettier,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  ...compat.extends('plugin:storybook/recommended'),
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      prettier,
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
      // サイクロマティック複雑度が15を超えるとエラー
      complexity: ['error', 15],
      // Any型は警告のとどめて許容する
      '@typescript-eslint/no-explicit-any': 'warn',
      // 未使用変数
      'no-unused-vars': 'off', // 無効化：ESLint 本体の no-unused-vars
      'react/react-in-jsx-scope': 'off', // 無効化：React での JSX 内の未使用変数
      '@typescript-eslint/no-unused-vars': [
        // 有効化：TypeScript 用の no-unused-vars
        'error',
        {
          vars: 'all', // すべての変数を対象（default）
          args: 'after-used', // 使用されていない引数のみ警告
          ignoreRestSiblings: true, // 分割代入の残り要素を無視
          argsIgnorePattern: '^_', // アンダースコア始まりの引数は無視
          varsIgnorePattern: '^_', // アンダースコア始まりの変数も無視
        },
      ],
      // 未定義変数の使用を許可（TypeScriptでチェックするため）
      'no-undef': 'off',
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
