# 1. 依存関係のインストール用ステージ
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat git
WORKDIR /app

# パッケージ定義ファイルをコピー
COPY package.json package-lock.json* ./
# lefthook が .git ディレクトリを要求するため、ダミーで初期化してからインストールする
RUN git init && npm ci

# 2. ビルド用ステージ
FROM node:22-alpine AS builder
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

# 3. 実行用ステージ
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
# Docker内の3000ポートで待ち受ける
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ビルド成果物・依存パッケージをすべてコピー（Standaloneではなく普通に実行するため全コピー）
COPY --from=builder --chown=nextjs:nodejs /app ./

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
