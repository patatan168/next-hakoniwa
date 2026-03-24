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

# 3. 実行用ステージ
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
# Docker内の3000ポートで待ち受ける
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 実行に必要な成果物のみコピーしてイメージを軽量化する
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/src/db ./src/db
COPY --from=builder --chown=nextjs:nodejs /app/src/global ./src/global

# runner用にはproduction依存のみインストールしてイメージサイズを削減する
RUN npm ci --omit=dev
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
