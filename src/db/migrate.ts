import { promises as fs } from 'fs';
import { FileMigrationProvider, Migrator } from 'kysely';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { db } from './kysely';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // Migration files are co-located in this package
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  if (results) {
    results.forEach((it) => {
      if (it.status === 'Success') {
        console.log(`migration "${it.migrationName}" was executed successfully`);
      } else if (it.status === 'Error') {
        console.error(`failed to execute migration "${it.migrationName}"`);
      }
    });
  }

  if (error) {
    console.error('failed to migrate');
    console.error(error);
    process.exit(1);
  }

  return;
}

// 実行された場合のみマイグレーションを行う
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('initDb.ts')) {
  migrateToLatest().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
