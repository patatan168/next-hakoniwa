# Docker検証環境（本番相当）について

このプロジェクトでは、本番公開時とほぼ同じ構成（Nginx + Next.js + MySQL）をローカルに再現し、システムの動作検証を行うためのDocker Compose環境を用意しています。

特に **Passkey（WebAuthn）** を使った認証など、「HTTPS（暗号化通信）が必須」「アクセス元のURL（Origin）が厳密に一致しないとエラーになる」といった、ローカル環境単体（`npm run dev`）ではテストしづらい機能の検証に必要となります。

## システム構成

- **`web` (Nginx)**: リバースプロキシ。ポート `443` (HTTPS) および `80` (HTTP) で待機し、Appコンテナへ通信を流します。
- **`app` (Next.js)**: アプリケーション本体。ビルド済みのNext.jsサーバーが稼働します。起動時にDBマイグレーションも自動実行します。
- **`mysql` (MySQL 8.0)**: データベース。ホストと競合しないよう、ホストマシンの `13306` ポートに公開されています。

---

## 起動手順

### 1. SSL/TLS 証明書の準備（初回のみ）

NginxでHTTPS通信を行うため、自己署名のSSL証明書（オレオレ証明書）を作成します。
プロジェクトルートで以下のコマンドを実行し、`.certs` ディレクトリにキーペアを生成してください。

```bash
mkdir -p .certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout .certs/localhost.key -out .certs/localhost.crt -subj "/CN=localhost"
```

### 2. アクセス先（Origin URL）の指定

Passkey認証の仕様上、**「ブラウザのアドレスバーのURL」** と、システムが認識する **「本来の起点URL（`NEXT_PUBLIC_ORIGIN_URL`）」** が完全に一致している必要があります。

`docker-compose.yml` を直接編集するのではなく、必要に応じてプロジェクトルートに **`.env.local`** ファイルを作成し、環境変数を書き換えてください。（`.env.local` はGit管理から除外されるため、自分専用の検証IPを書いても安全です）

- **自身のPCブラウザからテストする場合（デフォルト）**:
  何も設定しなくてOKです（`https://localhost` として扱われます）。

- **LAN内の別端末（スマホや別PC）からIPアドレスでテストする場合**:
  `.env.local` に以下の行を追記し、IPアドレスを書き換えます。
  ```env
  DOCKER_NEXT_PUBLIC_ORIGIN_URL=https://192.168.x.x
  ```

### 3. コンテナのビルドと起動

設定の変更を反映させるため、コンテナイメージを（再）ビルドしてから起動します。

```bash
# ビルド（.env.local で変更した場合は --env-file 指定が必要です）
docker compose --env-file .env --env-file .env.local build app

# バックグラウンドで起動
docker compose --env-file .env --env-file .env.local up -d
```

### 4. ブラウザでアクセス

設定したOrigin（例: `https://localhost/` または `https://192.168.x.x/`）へブラウザからアクセスします。

> [!WARNING]
> 自己署名証明書を使用しているため、ブラウザに「この接続ではプライバシーが保護されません」「安全ではありません」などの警告画面が表示されます。
> 開発用の仕様ですので、「詳細設定」や「Advanced」から **「localhost（IP）にアクセスする（安全ではありません）」** をクリックして続行してください。

---

## 運用・デバッグのヒント

### アプリケーションログの確認

Next.js サーバーやマイグレーションのエラーが起きていないかを確認する場合は、以下のコマンドでログを追跡できます。

```bash
docker logs -f hakoniwa-app
```

※ `Ready in ...` が表示されていれば起動成功です。

### データベースに直接接続する

ホストマシン（あなたのPC）のDBクライアントツール群から、コンテナ内のMySQLに接続したい場合は以下の情報を使用してください。

- **ホスト**: `127.0.0.1` または `localhost`
- **ポート**: `13306`
- **ユーザー**: `root`
- **パスワード**: `password` (docker-compose.yml 参照)
- **データベース**: `hakoniwa`

### よくあるエラー

- **`Passkey関連のエラーが生じる` / `Cannot read public key ...`**
  URLに関するエラーは、ほぼすべてOriginの不一致が原因です。例えばデフォルト（`https://localhost`）のままコンテナを起動した状態で `https://127.0.0.1` やLAN内の別IPでアクセスすると認証が拒否されます。必ずアクセスするURLに合わせて `.env.local` の `DOCKER_NEXT_PUBLIC_ORIGIN_URL` を設定し、**再ビルド**（`docker compose ... build app`）を行ってください。
