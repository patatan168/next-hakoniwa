# データベースマイグレーション ガイド

このドキュメントでは、Kysely を使ったデータベースマイグレーションの仕組みと、新しいマイグレーションファイルの作成方法を説明します。

---

## 概要

| ファイル                                                                       | 役割                                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [`src/db/kysely.ts`](file:///home/patatan/hakoniwa/src/db/kysely.ts)           | DB接続インスタンスの生成・型定義のエントリポイント                  |
| [`src/db/migrate.ts`](file:///home/patatan/hakoniwa/src/db/migrate.ts)         | `migrateToLatest()` 関数の定義とCLI実行エントリポイント             |
| [`src/db/migrations/`](file:///home/patatan/hakoniwa/src/db/migrations)        | マイグレーションファイルを格納するディレクトリ                      |
| [`src/db/generated.d.ts`](file:///home/patatan/hakoniwa/src/db/generated.d.ts) | `kysely-codegen` が自動生成するテーブル定義の型（**直接編集禁止**） |

---

## 対応DB

| `DB_TYPE` | 接続先                                                                                       |
| --------- | -------------------------------------------------------------------------------------------- |
| `sqlite`  | `DB_CONNECTION_STRING` をファイルパスとして `better-sqlite3` で接続                          |
| `mysql`   | `DB_CONNECTION_STRING` を接続URLとして `mysql2` のコネクションプールで接続（MySQL 5.7 以上） |

---

## コマンド

```bash
# 初回セットアップ（マイグレーション実行 + 型生成）
npm run db:init

# マイグレーションのみ（差分適用 + 型生成）
npm run db:migrate

# 直前の1ステップをロールバック
npm run db:rollback

# 複数ステップをロールバック（例: 3ステップ分）
npx tsx ./src/db/migrate.ts down 3

# 型定義の再生成のみ（スキーマ変更なしで型だけ更新したい場合）
npm run db:codegen
```

> [!NOTE]
> `db:migrate` / `db:init` はどちらも `migrateToLatest()` を呼び出し、未適用のマイグレーションファイルを古い順に適用します。
> すでに適用済みのものはスキップされます。

---

## マイグレーションのロールバック

`npm run db:rollback` を実行すると、直前に適用した **1ステップ** だけロールバックします。
複数ステップを一度に戻したい場合は、ステップ数を直接引数で指定してください。

```bash
# 1ステップ戻す（デフォルト）
npm run db:rollback

# 3ステップ戻す
npx tsx ./src/db/migrate.ts down 3
```

> [!CAUTION]
> ロールバックを実行すると、対象マイグレーションの `down()` 関数が呼ばれます。
> データが削除される場合があるため、本番環境では十分注意してから実行してください。
> ロールバック後は `npm run db:codegen` で型定義を再生成することを推奨します。

---

## マイグレーションファイルの作成

### ファイルの命名規則

`src/db/migrations/` ディレクトリに、以下の形式でファイルを作成します。

```
YYYYMMDD_<説明>.ts
```

**例:**

```
20260308_init.ts
20260401_add_avatar.ts
```

> [!IMPORTANT]
> Kysely の `FileMigrationProvider` はファイル名をアルファベット順（辞書順）で適用します。
> 先頭に `YYYYMMDD` の日付を付けることで、作成順に適用されることを保証します。

### ファイルのテンプレート

```typescript
import { Kysely, SqliteAdapter, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  const isSqlite = db.getExecutor().adapter instanceof SqliteAdapter;

  // ここに ALTER TABLE や CREATE TABLE などの変更を記述する
  await db.schema
    .alterTable('some_table')
    .addColumn('new_column', 'text', (col) => col.notNull().defaultTo(''))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // up() で行った変更を元に戻す処理を記述する
  await db.schema.alterTable('some_table').dropColumn('new_column').execute();
}
```

### SQLite / MySQL の方言差分への対応

SQLite と MySQL でDDLが異なる場合は、`isSqlite` フラグで分岐してください。

```typescript
export async function up(db: Kysely<unknown>): Promise<void> {
  const isSqlite = db.getExecutor().adapter instanceof SqliteAdapter;

  // 例: タイムスタンプのデフォルト値
  const nowSql = isSqlite ? sql`(unixepoch())` : sql`CURRENT_TIMESTAMP`;

  // SQLite では PRAGMA で外部キーを有効化する必要がある
  if (isSqlite) {
    await sql`PRAGMA foreign_keys = ON`.execute(db);
  }

  // ...
}
```

### 型定義の更新

マイグレーションファイルを追加・変更したら、必ず以下を実行して `generated.d.ts` を同期させてください。

```bash
npm run db:migrate   # マイグレーション適用 + 型生成を同時に行う
# または
npm run db:codegen   # 型生成のみ
```

> [!WARNING]
> `src/db/generated.d.ts` は `kysely-codegen` によって自動生成されます。
> 直接編集してもマイグレーション後に上書きされるため、**変更は必ずマイグレーションファイルで行ってください**。

---

## `kysely.ts` での型オーバーライド

`kysely-codegen` の生成型そのままでは表現しきれない場合（JSON カラムの型など）は、
[`src/db/kysely.ts`](file:///home/patatan/hakoniwa/src/db/kysely.ts) で手動でオーバーライドします。

```typescript
// 例: island.island_info は string ではなく islandInfoData で受け取りたい
export interface IslandTable extends Omit<GeneratedDB['island'], 'island_info' | 'prize'> {
  island_info: ColumnType<islandInfoData, string | islandInfoData, string | islandInfoData>;
  prize: ColumnType<object, string | object, string | object>;
}

export interface Database extends Omit<GeneratedDB, 'island'> {
  island: IslandTable;
}
```

このように、Kysely の `ColumnType<SelectType, InsertType, UpdateType>` を活用することで、
SELECT / INSERT / UPDATE それぞれで異なる型を安全に扱えます。

## ディレクトリ構成

```
src/db/
├── kysely.ts           # DB接続・型定義
├── migrate.ts          # マイグレーション実行スクリプト
├── generated.d.ts      # ← 自動生成（編集禁止）
├── migrations/
│   └── 20260308_init.ts   # マイグレーションファイル
└── schema/
    ├── islandTable.ts   # island テーブルのカスタム型・パーサー
    └── islandTypes.ts   # island の型定義
```
