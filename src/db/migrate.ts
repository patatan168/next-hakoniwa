import { promises as fs } from 'fs';
import { FileMigrationProvider, Migrator } from 'kysely';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { db } from './kysely';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migrator インスタンスの生成
 */
function createMigrator(): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });
}

/**
 * マイグレーション結果のログ出力
 * @param results マイグレーション結果
 */
function logResults(results: Awaited<ReturnType<Migrator['migrateToLatest']>>['results']): void {
  results?.forEach((it) => {
    if (it.status === 'Success') {
      const direction = it.direction === 'Up' ? '↑ Up' : '↓ Down';
      console.log(`[${direction}] "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`[Error] failed to execute migration "${it.migrationName}"`);
    }
  });
}

/**
 * 全マイグレーションを最新状態まで適用
 */
export async function migrateToLatest(): Promise<void> {
  const migrator = createMigrator();
  const { error, results } = await migrator.migrateToLatest();

  logResults(results);

  if (error) {
    console.error('failed to migrate');
    console.error(error);
    process.exit(1);
  }
}

/**
 * 直前のマイグレーションをロールバック
 * @param steps ロールバックするステップ数（デフォルト: 1）
 */
export async function migrateDown(steps = 1): Promise<void> {
  const migrator = createMigrator();

  for (let i = 0; i < steps; i++) {
    const { error, results } = await migrator.migrateDown();

    logResults(results);

    if (error) {
      console.error(`failed to rollback (step ${i + 1})`);
      console.error(error);
      process.exit(1);
    }

    // 適用されたマイグレーションがなければロールバック完了
    if (!results || results.length === 0) {
      console.log('No more migrations to roll back.');
      break;
    }
  }
}

// CLIから直接実行された場合の処理
const script = process.argv[1] ?? '';
const command = process.argv[2];

if (script.endsWith('migrate.ts') || script.endsWith('initDb.ts')) {
  const steps = command === 'down' ? Number(process.argv[3] ?? 1) : undefined;

  if (command === 'down') {
    if (isNaN(steps!)) {
      console.error('Usage: npx tsx ./src/db/migrate.ts down [steps]');
      process.exit(1);
    }
    migrateDown(steps).catch((e) => {
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
