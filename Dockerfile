# 1. 依存関係のインストール用ステージ
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat git
WORKDIR /app

# パッケージ定義ファイルをコピー
COPY package.json package-lock.json* ./
# lefthook が .git ディレクトリを要求するため、ダミーで初期化してからインストールする
RUN git init && npm ci

# 2. ビルド用ステージ
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# productionビルド時にTelemetryをオプトアウト（任意）
ENV NEXT_TELEMETRY_DISABLED 1

# DB_TYPEはmysqlを指定してマイグレーションとcodegen用にも利用可能にしておく
ENV DB_TYPE mysql
# ビルド時の静的解析やプレレンダリングでMySQLパースエラーが起きないようにダミーのURLを設定
ENV DB_CONNECTION_STRING mysql://dummy:dummy@localhost:3306/hakoniwa

# Kyselyの自動生成はビルド時ではなくDB起動後に実行したいため、ここでは純粋なnext buildだけ行う
RUN npm run build
# runner向けに開発依存を削除しておく
RUN npm prune --omit=dev

# 3. 実行用ステージ
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
# Docker内の3000ポートで待ち受ける
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# node公式イメージに含まれる非rootユーザー(node)を利用する

# 実行に必要な成果物のみコピーしてイメージを軽量化する
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=node:node /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/src/db ./src/db
COPY --from=builder --chown=node:node /app/src/global ./src/global

# Next.js キャッシュ保存先を実行ユーザー(node)専用にする
RUN mkdir -p /app/.next/cache && chown -R node:node /app/.next/cache && chmod 700 /app/.next/cache
USER node

EXPOSE 3000

CMD ["npm", "start"]
