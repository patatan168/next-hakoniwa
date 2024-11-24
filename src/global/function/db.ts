/**
 * @file SQLite操作用のシンタックスシュガー
 */
import sqlite from 'better-sqlite3';

type DbForign = {
  /** テーブル名 */
  table: string;
  /** カラム名 */
  name: string;
};

/**
 * データベースのカラム
 * @property name カラム名
 * @property name 型
 * @property primary Primary Keyにするか
 */
type DbColomn = {
  /** カラム名 */
  name: string;
  /** 型 */
  type: string;
  /** Null許容 */
  nullable?: string;
  /** Primary Keyにするか */
  primary?: boolean;
  /** ユニークか */
  unique?: boolean;
  /** デフォルト値 */
  defVal?: string;
  /** Check */
  check?: string;
  /** 外部キー(リレーション) */
  forign?: DbForign;
};

/** データベースのスキーマ */
export type DbSchema = Array<DbColomn>;

/**
 * データベースに接続する
 * @param dbPath データベースのファイルパス
 * @returns BetterSqlite3.Database
 */
export const dbConn = (dbPath: string) => {
  //try to connect
  const client = new sqlite(dbPath, { verbose: console.debug });

  //return resource as disposable
  return {
    client,
    [Symbol.dispose]: () => {
      client.close();
    },
  };
};

/**
 * データベースのテーブルを作成する
 * @param db データベース
 */
export const createDbTable =
  (db: sqlite.Database) =>
  /**
   * データベースのテーブルを作成する
   * @param tableName テーブル名
   * @param schema スキーマ
   * @param overwrite 上書きするか
   */
  (tableName: string, schema: DbSchema, overwrite = false) => {
    const overWriteTable = overwrite ? '' : ' if not exists';
    const createTable = `create table${overWriteTable} ${tableName}`;

    // 外部キーを使用するか
    let isForigin = false;

    let colmun = '';
    schema.forEach(({ name, type, nullable, primary, unique, defVal, check, forign }) => {
      // NOTE: 安全のためにdefaultではnullを許容しない
      const nullableKey = nullable ? '' : ' NOT NULL';
      const primaryKey = primary ? ' PRIMARY KEY' : '';
      const uniqueKey = unique ? ' UNIQUE' : '';
      const defaultKey = defVal !== undefined ? ` DEFAULT ${defVal}` : '';
      const checkKey = check !== undefined ? ` CHECK (${defVal})` : '';
      const forignkKey = forign !== undefined ? ` REFERENCES ${forign.table}(${forign.name})` : '';

      // 外部キーを使用するテーブルかを判定
      isForigin = isForigin || forign !== undefined;

      colmun =
        colmun +
        `${name} ${type}${nullableKey}${primaryKey}${uniqueKey}${defaultKey}${checkKey}${forignkKey}, `;
    });
    // 末尾の空白とカンマをトリム
    colmun = colmun.trim().slice(0, -1);

    if (isForigin) db.pragma('foreign_keys = ON');

    db.prepare(`${createTable}(${colmun})`).run();
  };
