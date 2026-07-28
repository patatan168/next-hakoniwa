# Next.js Hakoniwa

[Next.js](https://nextjs.org) で実装された箱庭諸島のWebアプリケーションです。

## セットアップ

### 0. mise で開発ツールのバージョンを揃える

このリポジトリは `mise.toml` で Node.js / npm バージョンを管理します。

```bash
mise install
```

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. lefthook のインストール

このリポジトリでは Git Hook 管理に lefthook を使用します。
`npm install` 後に一度だけ以下を実行してください。

```bash
npm run lefthook
```

### 3. 環境変数の設定

`.env` ファイルを参考に、必要な環境変数を設定します。
詳細については [環境変数一覧](./docs/environment_variables.md) を参照してください。

### 4. データベースの初期化

```bash
npm run db:init
```

## コマンド一覧

| コマンド               | 説明                                                  |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | 開発サーバーの起動                                    |
| `npm run build`        | 通常の本番ビルド                                      |
| `npm run build:mini`   | 2CPU/2GB環境想定のビルド                              |
| `npm run build:docker` | ホスト側のビルドが難しい場合は、Docker 内でビルド実行 |
| `npm run start`        | 本番サーバーの起動                                    |
| `npm run test`         | ユニットテストの実行                                  |
| `npm run lint`         | ESLint / Stylelint / TypeScript の静的解析            |
| `npm run lefthook`     | Git Hook（pre-commit）のインストール                  |
| `npm run fmt`          | Prettier によるフォーマット                           |
| `npm run storybook`    | Storybook の起動（コンポーネントのカタログ）          |
| `npm run turn`         | ターン処理の手動実行                                  |

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

詳細な手順やOriginURLの設定については、[Docker検証環境手順](./docs/docker_verification.md) を参照してください。

```bash
docker compose build app
docker compose up -d
```

## Dockerでビルドのみ実行する

Amazon Linux などでホスト側のビルドが難しい場合は、Docker 内でビルドだけを実行できます。Compose の一時コンテナとして実行するため、シェルスクリプト依存なしで使えます。

```bash
npm run build:docker
```

## ドキュメント

| ドキュメント                                                 | 説明                                            |
| ------------------------------------------------------------ | ----------------------------------------------- |
| [認証仕様](./docs/auth_specification.md)                     | JWT・パスキー・アカウントロックアウトの仕様     |
| [データベースマイグレーション](./docs/database_migration.md) | マイグレーションの仕組みと操作手順              |
| [データベース仕様](./docs/database_specification.md)         | データベースのテーブル定義とリレーションシップ  |
| [環境変数一覧](./docs/environment_variables.md)              | 全環境変数の説明とデフォルト値                  |
| [ターン処理仕様](./docs/turn_process_specification.md)       | ターン処理の実行順序とシーケンス図              |
| [ターンログ仕様](./docs/turn_log_specification.md)           | ターンログのカスタムタグ仕様                    |
| [Define追加ガイド](./docs/define/README.md)                  | plan/map/log/achievement 定義の追加手順と注意点 |
| [Docker検証環境手順](./docs/docker_verification.md)          | 本番相当環境（Nginx+MySQL）でのローカル検証手順 |

## 依存ライブラリ (主要)

| ライブラリ      | バージョン |
| --------------- | ---------- |
| Node.js         | 24.14.1    |
| TypeScript      | 6.0.3      |
| React           | 19.2.8     |
| Next.js         | 16.2.11    |
| Tailwind CSS    | 4.3.0      |
| kysely          | 0.29.4     |
| better-sqlite3  | 12.11.1    |
| mysql2          | 3.23.1     |
| sass            | 1.102.0    |
| zod             | 4.4.3      |
| argon2          | 0.45.1     |
| simpleWebAuthn  | 13.3.0     |
| zustand         | 5.0.14     |
| react-virtuoso  | 4.18.11    |
| react-hook-form | 7.76.0     |
| jsonwebtoken    | 9.0.3      |
| winston         | 3.19.0     |
