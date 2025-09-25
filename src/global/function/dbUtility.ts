import sqlite from 'better-sqlite3';

type TableInfo = {
  /** カラムID */
  cid: number,
  /** カラム名 */
  name: string,
  /** データ型（TEXT, INTEGER, REAL など） */
  type: string,
  /** NOT NULL 制約があるか（1 = あり, 0 = なし） */
  notnull: 1 | 0,
  /** デフォルト値（null なら未設定） */
  dflt_value: string | null,
  /** 主キーかどうか（1 = 主キー、0 = それ以外） */
  pk: 1 | 0,
}

/**
 * テーブルの情報を取得する
 * @param db データベース
 * @param tableName テーブル名
 * @returns テーブル情報の配列
 */
export const getTableInfo = (db: sqlite.Database, tableName: string) => {
  return db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<TableInfo>;
};

/** 
 * 全てのカラムを取得する
 * @param db データベース
 * @param tableName テーブル名
 * @returns 全てのカラム文字列
 */
export const allDbColumns = (db: sqlite.Database, tableName: string) => {
  const tableInfo = getTableInfo(db, tableName);
  let columns = '';
  for (const info of tableInfo) {
    // JSON型の場合はjson()で取得
    if (info.type.toLocaleLowerCase() === 'json') {
      columns = columns + `json(${tableName}.${info.name}) as ${info.name}, `;
    } else {
      columns = columns + `${tableName}.${info.name}, `;
    }
  }
  return columns.trim().slice(0, -1);
}