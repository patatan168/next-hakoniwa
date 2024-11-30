module.exports = {
  extends: [
    'eslint:recommended',
    'next/core-web-vitals',
    'next/typescript',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/strict',
    'prettier',
  ],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs', 'next.config.mjs', 'vitest.config.mts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: '2023',
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
    project: ['tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'jsx-a11y', 'react', 'react-refresh'],
  rules: {
    // ===にしないとエラー
    eqeqeq: 'error',
    // サイクロマティック複雑度が10を超えるとエラー
    complexity: ['error', 10],
    // Any型は警告のとどめて許容する
    '@typescript-eslint/no-explicit-any': 'warn',
    // Childrenの一行タグを許可<Example />
    'react/no-children-prop': 'off',
    // useEffectの依存関係のWariningを無効
    'react-hooks/exhaustive-deps': 'off',
    // JSXでvarは使わない
    'react/jsx-uses-vars': 'error',
    // JSX に直接コールバック関数の記述を警告
    // NOTE: render ごとに毎回新たな関数実体が生成されre-renderを引き起こすため
    'react/jsx-no-bind': [
      'error',
      {
        // アロー関数のコールバックは許可
        allowArrowFunctions: true,
      },
    ],
    // Componetの複数exportを警告
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
