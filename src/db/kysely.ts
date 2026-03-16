import sqlite from 'better-sqlite3';
import {
  ColumnType,
  Insertable,
  Kysely,
  MysqlDialect,
  Selectable,
  SqliteAdapter,
  SqliteDialect,
  Updateable,
} from 'kysely';
import mysql from 'mysql2';
import type { DB as GeneratedDB } from './generated';
import type { islandInfoData } from './schema/islandTypes';

/**
 * JSON カラムを考慮した Island テーブルの定義
 * SQLite 上は string ですが、Kysely 経由での SELECT 時はオブジェクト、
 * INSERT/UPDATE 時は文字列またはオブジェクトを受け取れるように定義します。
 */
export interface IslandTable extends Omit<GeneratedDB['island'], 'island_info'> {
  island_info: ColumnType<islandInfoData, string | islandInfoData, string | islandInfoData>;
}

/**
 * データベース全体の定義をオーバーライド
 * 自動生成された GeneratedDB の 'island' 表を、JSON 対応の IslandTable で差し替えます。
 */
export interface Database extends Omit<GeneratedDB, 'island'> {
  island: IslandTable;
}

export type Island = Selectable<IslandTable>;
export type NewIsland = Insertable<IslandTable>;
export type IslandUpdate = Updateable<IslandTable>;

export type User = Selectable<GeneratedDB['user']>;
export type Auth = Selectable<GeneratedDB['auth']>;
export type EventRate = Selectable<GeneratedDB['event_rate']>;
export type Plan = Selectable<GeneratedDB['plan']>;
export type TurnLog = Selectable<GeneratedDB['turn_log']>;
export type TurnResourceHistory = Selectable<GeneratedDB['turn_resource_history']>;
export type TurnState = Selectable<GeneratedDB['turn_state']>;
export type LastLogin = Selectable<GeneratedDB['last_login']>;
export type Role = Selectable<GeneratedDB['role']>;
export type AccessToken = Selectable<GeneratedDB['access_token']>;
export type RefreshToken = Selectable<GeneratedDB['refresh_token']>;
export type Passkey = Selectable<GeneratedDB['passkey']>;
export type Prize = Selectable<GeneratedDB['prize']>;
export type PlanStat = Selectable<GeneratedDB['plan_stats']>;
export type MissileStat = Selectable<GeneratedDB['missile_stats']>;

export type { islandInfo, islandInfoData } from './schema/islandTypes';

export type { islandData, islandInfoTurnProgress } from './schema/islandTable';

export { parseJsonIslandData, parseJsonIslandDataTurnProgress } from './schema/islandTable';

/**
 * Kysely インスタンスの生成
 * @returns Kysely インスタンス
 */
function getDialect(): Kysely<Database> {
  const dbType = process.env.DB_TYPE;
  const connectionString = process.env.DB_CONNECTION_STRING;

  if (dbType === 'sqlite') {
    if (!connectionString) {
      throw new Error('DB_CONNECTION_STRING is required for sqlite (path to db file)');
    }
    const database = new sqlite(connectionString);
    database.pragma('journal_mode = WAL');
    database.pragma('synchronous = NORMAL');
    database.pragma('cache_size = -16000');
    database.pragma('temp_store = MEMORY');
    return new Kysely<Database>({
      dialect: new SqliteDialect({
        database,
      }),
    });
  }

  if (dbType === 'mysql') {
    if (!connectionString) {
      throw new Error('DB_CONNECTION_STRING is required for mysql');
    }
    return new Kysely<Database>({
      dialect: new MysqlDialect({
        pool: mysql.createPool(
          connectionString
        ) as unknown as import('kysely').MysqlDialectConfig['pool'],
      }),
    });
  }

  throw new Error(`Unsupported database type: ${dbType}`);
}

export const db = getDialect();

/**
 * 接続中のDBがSQLiteかどうか
 * 起動時に1回だけ評価される
 */
export const isSqlite = db.getExecutor().adapter instanceof SqliteAdapter;
