import sqlite from 'better-sqlite3';
import { Kysely, ParseJSONResultsPlugin, SqliteDialect } from 'kysely';

import type { DB } from './generated';

/** kysely-codegen が生成した DB 型を Database として再エクスポート */
export type Database = DB;

export type { Generated } from './generated';

const dialect = new SqliteDialect({
  database: new sqlite('./src/db/data/main.db'),
});

export const db = new Kysely<Database>({
  dialect,
  // NOTE: SQLiteのJSONカラム（island_info, prize等）を自動でデシリアライズ
  plugins: [new ParseJSONResultsPlugin()],
});
