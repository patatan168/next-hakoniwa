/**
 * @file SQLite操作用のシンタックスシュガー
 */
import sqlite from 'better-sqlite3';
import { isEqual } from 'es-toolkit';
import { xss } from '../valid/xss';
import { getTableInfo } from './dbUtility';
import { parseDbData } from './utility';

type DbForeign = {
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
type DbColumn = {
  /** カラム名 */
  name: string;
  /** 型 */
  type: string;
  /** Null許容 */
  nullable?: boolean;
  /** Primary Keyにするか */
  primary?: boolean;
  /** ユニークか */
  unique?: boolean;
  /** デフォルト値 */
  defVal?: string;
  /** Check */
  check?: string;
  /** 外部キー(リレーション) */
  foreign?: DbForeign;
  /** トリガー */
  trigger?: string;
  /** インデックス */
  index?: { query: string[] };
};

/** データベースのスキーマ */
export type DbSchema = Array<DbColumn>;

/**
 * データベースに接続する
 * @param dbPath データベースのファイルパス
 * @returns BetterSqlite3.Database
 */
export const dbConn = (dbPath: string) => {
  //try to connect
  const verbose = process.env.NODE_ENV === 'development' ? console.debug : undefined;
  const client = new sqlite(dbPath, { verbose });

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
    const indexColumn: { name: string; query: string[] }[] = [];

    // 外部キーを使用するか
    let isForeign = false;

    let column = '';
    schema.forEach(
      ({ name, type, nullable, primary, unique, defVal, check, foreign, trigger, index }) => {
        // NOTE: 安全のためにdefaultではnullを許容しない
        const nullableKey = nullable ? '' : ' NOT NULL';
        const primaryKey = primary ? ' PRIMARY KEY' : '';
        const uniqueKey = unique ? ' UNIQUE' : '';
        const defaultKey = defVal !== undefined ? ` DEFAULT (${defVal})` : '';
        const checkKey = check !== undefined ? ` CHECK (${check})` : '';
        const foreignKey =
          foreign !== undefined ? ` REFERENCES ${foreign.table}(${foreign.name})` : '';

        // 外部キーを使用するテーブルかを判定
        isForeign = isForeign || foreign !== undefined;

        column =
          column +
          `${name} ${type}${nullableKey}${primaryKey}${uniqueKey}${defaultKey}${checkKey}${foreignKey}, `;
        if (trigger !== undefined) {
          db.exec(trigger);
        }
        if (index) {
          indexColumn.push({ name, query: index.query });
        }
      }
    );
    // 末尾の空白とカンマをトリム
    column = column.trim().slice(0, -1);

    if (isForeign) db.pragma('foreign_keys = ON');
    db.transaction(() => {
      db.prepare(`${createTable}(${column})`).run();
      indexColumn.forEach(({ name, query }) => {
        // マイグレーションの際、新しいテーブル名から"_new_"以降を削除
        const table = tableName.replace(/_new_.*$/, '');
        query.forEach((q) => {
          db.prepare(
            `CREATE INDEX IF NOT EXISTS ${name}_index ON ${table}(${name}${q ? ` ${q}` : ''})`
          ).run();
        });
      });
    })();
  };

/**
 * 既にDB内のデータが有るか
 */
export const existsDbDate = ({
  dbPath,
  table,
  key,
  data,
  condition,
}: {
  /** DBのFile Path */
  dbPath: string;
  /** テーブル名 */
  table: string;
  /** DBのKey */
  key: string;
  /** データー */
  data: unknown;
  /** 追加条件(NOTE:XSS対策は意図的にしていない) */
  condition?: string;
}) => {
  using db = dbConn(dbPath);
  const dbData = parseDbData(data);
  const tmpCondition = condition ? condition : '';
  const countData = db.client
    .prepare(`SELECT COUNT(*) FROM ${xss(table)} WHERE ${xss(key)} = ?${tmpCondition}`)
    .get(dbData) as { 'COUNT(*)': unknown };
  if (typeof countData['COUNT(*)'] === 'number') {
    return countData['COUNT(*)'] > 0;
  } else {
    throw new Error('Exception Error.');
  }
};

/**
 * トリガーを全て削除してから再作成する
 * @param db データベース
 */
export const triggerReset = (db: sqlite.Database) => {
  const triggers = db
    .prepare(`SELECT name, sql FROM sqlite_master WHERE type='trigger'`)
    .all() as Array<{ name: string; sql: string }>;
  triggers.forEach(({ name, sql }) => {
    db.prepare(`DROP TRIGGER IF EXISTS ${name}`).run();
    db.prepare(sql).run();
  });
};

/**
 * 指定テーブルをDbSchemaに合わせて移行する関数（全カラム・制約対応）
 * @param db データベース
 */
export const migrateDbTable =
  (db: sqlite.Database) =>
  /**
   * 指定テーブルをDbSchemaに合わせて移行する（全カラム・制約対応）
   * @param tableName テーブル名
   * @param schema DbSchema
   */
  (tableName: string, schema: DbSchema) => {
    // 新しいテーブルを作成
    const createTable = createDbTable(db);
    const newTableName = `${tableName}_new_${Date.now()}`;
    createTable(newTableName, schema);
    try {
      // 新旧テーブルで構造に差異がない場合は新テーブルを破棄してスキップ
      const newTableInfo = getTableInfo(db, newTableName);
      const oldTableInfo = getTableInfo(db, tableName);
      if (isEqual(newTableInfo, oldTableInfo)) {
        console.log('テーブルの構造に変更がないため、新テーブルを破棄します。');
        // 新しいテーブルを削除
        db.prepare(`DROP TABLE ${newTableName}`).run();
        return;
      }

      // 既存カラム名を取得
      const oldColumns = getTableInfo(db, tableName);
      const oldColumnNames = oldColumns.map((col) => col.name);

      // 新旧で共通するカラムのみコピー
      const copyColumns = schema
        .map((col) => col.name)
        .filter((name) => oldColumnNames.includes(name))
        .join(', ');
      if (copyColumns.length > 0) {
        db.prepare(
          `INSERT INTO ${newTableName} (${copyColumns}) SELECT ${copyColumns} FROM ${tableName}`
        ).run();
      }

      // 古いテーブルを削除
      db.prepare(`DROP TABLE ${tableName}`).run();
      // 新しいテーブルの名前を元に戻す
      db.prepare(`ALTER TABLE ${newTableName} RENAME TO ${tableName}`).run();
    } catch (error) {
      console.error('テーブル移行中にエラーが発生しました');
      // 新しいテーブルを削除
      db.prepare(`DROP TABLE ${newTableName}`).run();
      throw error;
    }
  };
