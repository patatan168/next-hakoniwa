# Next.js Hakoniwa

[Next.js](https://nextjs.org) で実装された箱庭諸島のWebアプリケーションです。

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを参考に、必要な環境変数を設定します。
詳細については [環境変数一覧](./docs/environment-variables.md) を参照してください。

### 3. データベースの初期化

```bash
npm run db:init
```

## コマンド一覧

| コマンド            | 説明                                         |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | 開発サーバーの起動                           |
| `npm run build`     | 本番ビルド                                   |
| `npm run start`     | 本番サーバーの起動                           |
| `npm run test`      | ユニットテストの実行                         |
| `npm run lint`      | ESLint / Stylelint / TypeScript の静的解析   |
| `npm run fmt`       | Prettier によるフォーマット                  |
| `npm run storybook` | Storybook の起動（コンポーネントのカタログ） |
| `npm run turn`      | ターン処理の手動実行                         |

### データベース操作

| コマンド              | 説明                                  |
| --------------------- | ------------------------------------- |
| `npm run db:init`     | マイグレーション実行 + 型生成（初回） |
| `npm run db:migrate`  | 未適用マイグレーションの適用 + 型生成 |
| `npm run db:rollback` | 直前の1ステップをロールバック         |
| `npm run db:codegen`  | 型定義の再生成のみ                    |

## 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開くと結果を確認できます。

### コンポーネントカタログ（Storybook）

```bash
npm run storybook
```

[http://localhost:6006](http://localhost:6006) をブラウザで開くと確認できます。

## Docker検証環境の起動（推奨）

Passkey（WebAuthn）を用いた認証や、自己署名証明書によるHTTPS通信などのテストを行うには、本番相当のコンテナ環境を使用します。

詳細な手順やOriginURLの設定については、[Docker検証環境手順](./docs/docker-verification.md) を参照してください。

```bash
docker compose build app
docker compose up -d
```

## ドキュメント

| ドキュメント                                                 | 説明                                            |
| ------------------------------------------------------------ | ----------------------------------------------- |
| [認証仕様](./docs/auth_specification.md)                     | JWT・パスキー・アカウントロックアウトの仕様     |
| [データベースマイグレーション](./docs/database-migration.md) | マイグレーションの仕組みと操作手順              |
| [環境変数一覧](./docs/environment-variables.md)              | 全環境変数の説明とデフォルト値                  |
| [ターンログ仕様](./docs/turn_log_specification.md)           | ターンログのカスタムタグ仕様                    |
| [Docker検証環境手順](./docs/docker-verification.md)          | 本番相当環境（Nginx+MySQL）でのローカル検証手順 |

## 依存ライブラリ

| ライブラリ                | バージョン |
| ------------------------- | ---------- |
| Node.js                   | 22.22.0    |
| React                     | 19.2.4     |
| Next.js                   | 16.1.6     |
| Tailwind CSS              | 4.x        |
| sass                      | 1.x        |
| React Icons               | 5.x        |
| react-virtuoso            | 4.x        |
| better-sqlite3            | 12.x       |
| react-hook-form           | 7.x        |
| zod                       | 4.x        |
| es-toolkit                | 1.x        |
| kysely                    | 0.28.x     |
| jsonwebtoken              | 9.x        |
| winston                   | 3.x        |
| winston-daily-rotate-file | 5.x        |
| argon2                    | 0.44.x     |
| auto-animate              | 0.9.x      |
| zustand                   | 5.x        |
| croner                    | 10.x       |
| simpleWebAuthn            | 13.x       |
