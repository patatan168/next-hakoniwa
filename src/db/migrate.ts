import { db } from './kysely';
import { up } from './migrations/schema';

/**
 * スキーマを最新状態に同期する
 * 既存のテーブルやデータは維持し、不足しているテーブルやカラムのみを追加する
 */
export async function migrateToLatest(): Promise<void> {
  console.log('Synchronizing schema...');
  try {
    await up(db);
    console.log('Schema synchronization completed successfully.');
  } catch (e) {
    console.error('Failed to synchronize schema:', e);
    process.exit(1);
  }
}

/**
 * データベースの全テーブルを削除して初期化する
 */
export async function migrateDown(): Promise<void> {
  console.log('Dropping all tables...');
  try {
    const tables = await db.introspection.getTables();
    for (const table of tables) {
      await db.schema.dropTable(table.name).ifExists().execute();
      console.log(`Dropped table: ${table.name}`);
    }
    console.log('All tables dropped successfully.');
  } catch (e) {
    console.error('Failed to drop tables:', e);
    process.exit(1);
  }
}

// CLIから直接実行された場合の処理
const script = process.argv[1] ?? '';
const command = process.argv[2];

if (script.endsWith('migrate.ts') || script.endsWith('initDb.ts')) {
  if (command === 'down' || command === 'reset') {
    migrateDown().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  } else {
    migrateToLatest().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  }
}
