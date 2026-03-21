/**
 * @module schema
 * @description データベーススキーマのマイグレーション定義。
 */
import META_DATA from '@/global/define/metadata';
import argon2 from 'argon2';
import crypto from 'crypto';
import { ColumnDataType, ColumnDefinitionBuilder, Kysely, sql, SqliteAdapter } from 'kysely';
import { Database } from '../kysely';

export type ColumnDefinition = {
  type: ColumnDataType | string;
  config?: (col: ColumnDefinitionBuilder) => ColumnDefinitionBuilder;
};

export type TableDefinition = Record<string, ColumnDefinition>;

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * テーブルを再作成し、既存データを移行する。
 * @param db - Kyselyインスタンス
 * @param tableName - 対象テーブル名
 * @param columns - 期待するカラム定義
 * @param isSqlite - SQLiteかどうか
 */
async function rebuildTableWithData(
  db: Kysely<Database>,
  tableName: string,
  columns: TableDefinition,
  isSqlite: boolean
): Promise<void> {
  console.log(`[DEBUG] introspecting tables for ${tableName}...`);
  const existingTables = await db.introspection.getTables();
  console.log(`[DEBUG] finished introspecting for ${tableName}`);
  const existingTable = existingTables.find((t) => t.name === tableName);

  if (!existingTable) {
    let tb = db.schema.createTable(tableName);
    for (const [colName, def] of Object.entries(columns)) {
      if (def.config) {
        tb = tb.addColumn(colName, def.type as ColumnDataType, def.config);
      } else {
        tb = tb.addColumn(colName, def.type as ColumnDataType);
      }
    }
    await tb.execute();
    console.log(`Created table: ${tableName}`);
    return;
  }

  // カラムの差分確認
  const hasMissingColumns = Object.keys(columns).some(
    (colName) => !existingTable.columns.some((c) => c.name === colName)
  );
  if (!hasMissingColumns) return;

  console.log(`Rebuilding table to apply new schema: ${tableName}`);
  const tempTableName = `${tableName}_new_${Date.now()}`;

  let tempTb = db.schema.createTable(tempTableName);
  for (const [colName, def] of Object.entries(columns)) {
    if (def.config) {
      tempTb = tempTb.addColumn(colName, def.type as ColumnDataType, def.config);
    } else {
      tempTb = tempTb.addColumn(colName, def.type as ColumnDataType);
    }
  }
  await tempTb.execute();

  const commonColumns = Object.keys(columns).filter((colName) =>
    existingTable.columns.some((c) => c.name === colName)
  );

  if (commonColumns.length > 0) {
    const columnsSql = sql.join(commonColumns.map((c) => sql.ref(c)));
    await sql`INSERT INTO ${sql.table(tempTableName)} (${columnsSql}) SELECT ${columnsSql} FROM ${sql.table(
      tableName
    )}`.execute(db);
  }

  if (isSqlite) await sql`PRAGMA foreign_keys = OFF`.execute(db);
  await db.schema.dropTable(tableName).execute();
  await db.schema.alterTable(tempTableName).renameTo(tableName).execute();
  if (isSqlite) await sql`PRAGMA foreign_keys = ON`.execute(db);

  console.log(`Rebuild completed: ${tableName}`);
}

/**
 * 特殊テーブルが存在しない場合に作成する。
 * @param db - Kyselyインスタンス
 * @param tableName - 対象テーブル名
 * @returns テーブルを作成した場合はtrue
 */
async function createSpecialTableIfNeeded(
  db: Kysely<Database>,
  tableName: string
): Promise<boolean> {
  const existingTables = await db.introspection.getTables();
  const existingTable = existingTables.find((t) => t.name === tableName);
  if (existingTable) return false;

  if (tableName === 'prize') {
    await db.schema
      .createTable('prize')
      .addColumn('uuid', 'varchar(25)', (col) => col.notNull().references('user.uuid'))
      .addColumn('prize', 'varchar(63)', (col) => col.notNull())
      .addPrimaryKeyConstraint('prize_pk', ['uuid', 'prize'])
      .execute();
    console.log(`Created table: ${tableName} with composite primary key`);
    return true;
  }

  if (tableName === 'plan_stats') {
    await db.schema
      .createTable('plan_stats')
      .addColumn('uuid', 'varchar(25)', (col) => col.notNull().references('user.uuid'))
      .addColumn('plan', 'varchar(511)', (col) => col.notNull())
      .addColumn('count', 'integer', (col) => col.defaultTo(0).notNull())
      .addPrimaryKeyConstraint('plan_stats_pk', ['uuid', 'plan'])
      .execute();
    console.log(`Created table: ${tableName} with composite primary key`);
    return true;
  }

  if (tableName === 'missile_stats') {
    await db.schema
      .createTable('missile_stats')
      .addColumn('uuid', 'varchar(25)', (col) => col.primaryKey().notNull().references('user.uuid'))
      .addColumn('monster_kill', 'integer', (col) => col.defaultTo(0).notNull())
      .addColumn('city_kill', 'integer', (col) => col.defaultTo(0).notNull())
      .execute();
    console.log(`Created table: ${tableName}`);
    return true;
  }

  if (tableName === 'missile_destroy_map_stats') {
    await db.schema
      .createTable('missile_destroy_map_stats')
      .addColumn('uuid', 'varchar(25)', (col) => col.notNull().references('user.uuid'))
      .addColumn('map_type', 'varchar(511)', (col) => col.notNull())
      .addColumn('count', 'integer', (col) => col.defaultTo(0).notNull())
      .addPrimaryKeyConstraint('missile_destroy_map_stats_pk', ['uuid', 'map_type'])
      .execute();
    console.log(`Created table: ${tableName} with composite primary key`);
    return true;
  }

  if (tableName === 'missile_kill_monster_stats') {
    await db.schema
      .createTable('missile_kill_monster_stats')
      .addColumn('uuid', 'varchar(25)', (col) => col.notNull().references('user.uuid'))
      .addColumn('monster_type', 'varchar(511)', (col) => col.notNull())
      .addColumn('count', 'integer', (col) => col.defaultTo(0).notNull())
      .addPrimaryKeyConstraint('missile_kill_monster_stats_pk', ['uuid', 'monster_type'])
      .execute();
    console.log(`Created table: ${tableName} with composite primary key`);
    return true;
  }

  return false;
}

async function syncDesiredSchema(
  db: Kysely<Database>,
  desiredSchema: Record<string, TableDefinition>,
  isSqlite: boolean
): Promise<void> {
  console.log('[DEBUG] Starting table sync loops...');
  for (const [tableName, columns] of Object.entries(desiredSchema)) {
    console.log(`[DEBUG] Processing table: ${tableName}`);
    const isSpecialCreated = await createSpecialTableIfNeeded(db, tableName);
    if (isSpecialCreated) continue;
    await rebuildTableWithData(db, tableName, columns, isSqlite);
  }
  console.log('[DEBUG] Finished table sync loops.');
}

async function dropLegacyRoleTableIfExists(db: Kysely<Database>): Promise<void> {
  const tables = await db.introspection.getTables();
  if (tables.some((t) => t.name === 'role')) {
    await db.schema.dropTable('role').execute();
    console.log('Dropped legacy table: role');
  }
}

async function createSchemaIndexes(db: Kysely<Database>, isSqlite: boolean): Promise<void> {
  console.log('[DEBUG] Creating indexes...');
  const runSafe = async (query: import('kysely').RawBuilder<unknown>) => {
    try {
      await query.execute(db);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code !== 'ER_DUP_KEYNAME') console.warn(err.message ?? 'Unknown error');
    }
  };

  if (isSqlite) {
    await sql`CREATE INDEX IF NOT EXISTS user_inhabited_index ON user(inhabited)`.execute(db);
    await sql`CREATE INDEX IF NOT EXISTS island_population_index ON island(population)`.execute(db);
    await sql`CREATE INDEX IF NOT EXISTS turn_log_uuid_index ON turn_log(log_uuid DESC)`.execute(
      db
    );
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS turn_resource_history_uuid_turn_unique ON turn_resource_history(uuid, turn)`.execute(
      db
    );
    await sql`CREATE INDEX IF NOT EXISTS turn_resource_history_uuid_index ON turn_resource_history(uuid)`.execute(
      db
    );
    await sql`CREATE INDEX IF NOT EXISTS plan_from_uuid_index ON plan(from_uuid)`.execute(db);
    return;
  }

  await runSafe(sql`CREATE INDEX user_inhabited_index ON user(inhabited)`);
  await runSafe(sql`CREATE INDEX island_population_index ON island(population)`);
  await runSafe(sql`CREATE INDEX turn_log_uuid_index ON turn_log(log_uuid DESC)`);
  await runSafe(
    sql`CREATE UNIQUE INDEX turn_resource_history_uuid_turn_unique ON turn_resource_history(uuid, turn)`
  );
  await runSafe(sql`CREATE INDEX turn_resource_history_uuid_index ON turn_resource_history(uuid)`);
  await runSafe(sql`CREATE INDEX plan_from_uuid_index ON plan(from_uuid)`);
  await runSafe(sql`ALTER TABLE prize ADD PRIMARY KEY (uuid, prize)`);
}

async function ensureTurnStateSeeded(db: Kysely<Database>): Promise<void> {
  const countRes = await sql<{ cnt: number }>`SELECT COUNT(*) as cnt FROM turn_state`.execute(db);
  const count = Number(countRes.rows[0]?.cnt ?? 0);
  if (count !== 0) return;

  await sql`INSERT INTO turn_state (turn, turn_processing, last_updated_at) VALUES (0, 0, 0)`.execute(
    db
  );
}

async function seedInitialModerator(db: Kysely<Database>): Promise<void> {
  const moderatorCount = await sql<{
    cnt: number;
  }>`SELECT COUNT(*) as cnt FROM moderator_auth`.execute(db);
  const moderatorAuthCount = Number(moderatorCount.rows[0]?.cnt ?? 0);
  if (moderatorAuthCount !== 0) return;

  const initialId = process.env.MODERATOR_INITIAL_ID;
  const initialPassword = process.env.MODERATOR_INITIAL_PASSWORD;
  const initialUserName = process.env.MODERATOR_INITIAL_USER_NAME ?? 'Administrator';
  const initialRole = Number(process.env.MODERATOR_INITIAL_ROLE ?? 0);

  if (!initialId || !initialPassword) {
    console.warn(
      'MODERATOR_INITIAL_ID or MODERATOR_INITIAL_PASSWORD is not set. Skipped initial moderator seeding.'
    );
    return;
  }

  const hashId = sha256(initialId);
  const hashPassword = await argon2.hash(initialPassword);
  const initialUuid = '0000000000000000000000000';

  await db
    .insertInto('moderator_auth')
    .values({
      uuid: initialUuid,
      id: hashId,
      password: hashPassword,
      user_name: initialUserName,
      role: initialRole,
      must_change_credentials: 1,
    })
    .execute();

  console.log('Seeded initial moderator account.');
}

/**
 * マイグレーションを適用する。
 * @param db - Kyselyインスタンス
 */
export async function up(db: Kysely<Database>): Promise<void> {
  console.log('[DEBUG] Starting up() function...');
  const isSqlite = db.getExecutor().adapter instanceof SqliteAdapter;
  console.log(`[DEBUG] isSqlite: ${isSqlite}`);
  const nowSql = isSqlite ? sql`(unixepoch())` : sql`(UNIX_TIMESTAMP())`;

  if (isSqlite) {
    await sql`PRAGMA foreign_keys = ON`.execute(db);
  }

  // ========== 宣言的スキーマ定義 ==========
  // ここにテーブルとカラムの定義を追加・上書きしていくことで、自動的にDBに反映されます。
  const desiredSchema: Record<string, TableDefinition> = {
    user: {
      uuid: { type: 'varchar(25)', config: (col) => col.primaryKey().unique().notNull() },
      user_name: { type: 'varchar(64)', config: (col) => col.notNull() },
      island_name_prefix: { type: 'varchar(16)', config: (col) => col.defaultTo('').notNull() },
      island_name: { type: 'varchar(64)', config: (col) => col.notNull() },
      island_name_changed_at: { type: 'bigint', config: (col) => col.defaultTo(nowSql).notNull() },
      inhabited: { type: 'integer', config: (col) => col.defaultTo(1).notNull() },
    },
    auth: {
      uuid: {
        type: 'varchar(25)',
        config: (col) => col.primaryKey().unique().notNull().references('user.uuid'),
      },
      id: { type: 'varchar(64)', config: (col) => col.unique().notNull() },
      password: { type: 'varchar(511)', config: (col) => col.notNull() },
      created_at: { type: 'bigint', config: (col) => col.defaultTo(nowSql).notNull() },
      login_fail_count: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
      locked_until: { type: 'datetime' },
      fp_hash: { type: 'varchar(255)', config: (col) => col.defaultTo('').notNull() },
    },
    moderator_auth: {
      uuid: { type: 'varchar(25)', config: (col) => col.primaryKey().unique().notNull() },
      id: { type: 'varchar(64)', config: (col) => col.unique().notNull() },
      password: { type: 'varchar(511)', config: (col) => col.notNull() },
      user_name: { type: 'varchar(64)', config: (col) => col.notNull() },
      role: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
      must_change_credentials: { type: 'integer', config: (col) => col.defaultTo(1).notNull() },
      created_at: { type: 'bigint', config: (col) => col.defaultTo(nowSql).notNull() },
      login_fail_count: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
      locked_until: { type: 'datetime' },
    },
    moderator_session: {
      session_id: { type: 'varchar(128)', config: (col) => col.primaryKey().notNull() },
      uuid: {
        type: 'varchar(25)',
        config: (col) => col.notNull().references('moderator_auth.uuid'),
      },
      public_key: { type: 'varchar(255)', config: (col) => col.unique().notNull() },
      created_at: { type: 'bigint', config: (col) => col.defaultTo(nowSql).notNull() },
      expires: { type: 'datetime', config: (col) => col.notNull() },
    },
    last_login: {
      uuid: {
        type: 'varchar(25)',
        config: (col) => col.primaryKey().unique().notNull().references('user.uuid'),
      },
      last_login_at: { type: 'bigint', config: (col) => col.defaultTo(nowSql).notNull() },
      last_bonus_received_at: { type: 'bigint', config: (col) => col.defaultTo(0).notNull() },
      consecutive_login_days: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
    },
    island: {
      uuid: {
        type: 'varchar(25)',
        config: (col) => col.primaryKey().unique().notNull().references('user.uuid'),
      },
      money: { type: 'integer', config: (col) => col.notNull() },
      area: { type: 'integer', config: (col) => col.notNull() },
      population: { type: 'integer', config: (col) => col.notNull() },
      food: { type: 'integer', config: (col) => col.notNull() },
      farm: { type: 'integer', config: (col) => col.notNull() },
      factory: { type: 'integer', config: (col) => col.notNull() },
      mining: { type: 'integer', config: (col) => col.notNull() },
      missile: { type: 'integer', config: (col) => col.notNull() },
      prize: { type: 'varchar(63)', config: (col) => col.notNull() },
      island_info: { type: 'json', config: (col) => col.notNull() },
    },
    prize: {
      uuid: {
        type: 'varchar(25)',
        config: (col) => col.notNull().references('user.uuid'),
      },
      prize: { type: 'varchar(63)', config: (col) => col.notNull() },
    },
    turn_log: {
      log_uuid: { type: 'varchar(25)', config: (col) => col.primaryKey().notNull() },
      from_uuid: { type: 'varchar(25)', config: (col) => col.notNull().references('user.uuid') },
      to_uuid: { type: 'varchar(25)', config: (col) => col.references('user.uuid') },
      turn: { type: 'integer', config: (col) => col.notNull() },
      secret_log: { type: 'varchar(2000)', config: (col) => col.notNull() },
      log: { type: 'varchar(2000)' },
    },
    turn_resource_history: {
      uuid: { type: 'varchar(25)', config: (col) => col.notNull().references('user.uuid') },
      turn: { type: 'integer', config: (col) => col.notNull() },
      population: { type: 'integer', config: (col) => col.notNull() },
      food: { type: 'integer', config: (col) => col.notNull() },
      money: { type: 'integer', config: (col) => col.notNull() },
    },
    plan: {
      from_uuid: { type: 'varchar(25)', config: (col) => col.notNull().references('user.uuid') },
      to_uuid: { type: 'varchar(25)', config: (col) => col.notNull().references('user.uuid') },
      plan_no: { type: 'integer', config: (col) => col.notNull() },
      times: { type: 'integer', config: (col) => col.notNull() },
      x: { type: 'integer', config: (col) => col.notNull() },
      y: { type: 'integer', config: (col) => col.notNull() },
      plan: { type: 'varchar(511)', config: (col) => col.notNull() },
    },
    plan_stats: {
      uuid: { type: 'varchar(25)', config: (col) => col.notNull().references('user.uuid') },
      plan: { type: 'varchar(511)', config: (col) => col.notNull() },
      count: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
    },
    missile_stats: {
      uuid: {
        type: 'varchar(25)',
        config: (col) => col.primaryKey().notNull().references('user.uuid'),
      },
      monster_kill: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
      city_kill: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
    },
    missile_destroy_map_stats: {
      uuid: { type: 'varchar(25)', config: (col) => col.notNull().references('user.uuid') },
      map_type: { type: 'varchar(511)', config: (col) => col.notNull() },
      count: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
    },
    missile_kill_monster_stats: {
      uuid: { type: 'varchar(25)', config: (col) => col.notNull().references('user.uuid') },
      monster_type: { type: 'varchar(511)', config: (col) => col.notNull() },
      count: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
    },
    event_rate: {
      uuid: {
        type: 'varchar(25)',
        config: (col) => col.primaryKey().notNull().references('user.uuid'),
      },
      earthquake: {
        type: 'real',
        config: (col) => col.defaultTo(META_DATA.EARTHQUAKE_RATE).notNull(),
      },
      tsunami: { type: 'real', config: (col) => col.defaultTo(META_DATA.TSUNAMI_RATE).notNull() },
      typhoon: { type: 'real', config: (col) => col.defaultTo(META_DATA.TYPHOON_RATE).notNull() },
      meteorite: {
        type: 'real',
        config: (col) => col.defaultTo(META_DATA.METEORITE_RATE).notNull(),
      },
      huge_meteorite: {
        type: 'real',
        config: (col) => col.defaultTo(META_DATA.HUGE_METEORITE_RATE).notNull(),
      },
      eruption: { type: 'real', config: (col) => col.defaultTo(META_DATA.ERUPTION_RATE).notNull() },
      fire: { type: 'real', config: (col) => col.defaultTo(META_DATA.FIRE_RATE).notNull() },
      buried_treasure: {
        type: 'real',
        config: (col) => col.defaultTo(META_DATA.BURIED_TREASURE_RATE).notNull(),
      },
      oil_field: {
        type: 'real',
        config: (col) => col.defaultTo(META_DATA.OIL_FIELD_RATE).notNull(),
      },
      oil_exhaustion: {
        type: 'real',
        config: (col) => col.defaultTo(META_DATA.OIL_EXHAUSTION_RATE).notNull(),
      },
      fall_down: {
        type: 'real',
        config: (col) => col.defaultTo(META_DATA.FALL_DOWN_RATE).notNull(),
      },
      monster: { type: 'real', config: (col) => col.defaultTo(META_DATA.MONSTER_RATE).notNull() },
      propaganda: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
    },
    access_token: {
      uuid: { type: 'varchar(255)', config: (col) => col.notNull().references('user.uuid') },
      session_id: { type: 'varchar(32)', config: (col) => col.notNull() },
      public_key: { type: 'varchar(255)', config: (col) => col.unique().notNull() },
      created_at: { type: 'bigint', config: (col) => col.defaultTo(nowSql).notNull() },
      expires: { type: 'datetime', config: (col) => col.notNull() },
      id: isSqlite
        ? { type: 'integer' }
        : { type: 'bigint', config: (col) => col.notNull().autoIncrement().unique() },
    },
    refresh_token: {
      uuid: { type: 'varchar(255)', config: (col) => col.notNull().references('user.uuid') },
      session_id: { type: 'varchar(128)', config: (col) => col.notNull() },
      public_key: { type: 'varchar(255)', config: (col) => col.unique().notNull() },
      created_at: { type: 'bigint', config: (col) => col.defaultTo(nowSql).notNull() },
      expires: { type: 'datetime', config: (col) => col.notNull() },
      id: isSqlite
        ? { type: 'integer' }
        : { type: 'bigint', config: (col) => col.notNull().autoIncrement().unique() },
    },
    passkey: {
      credential_id: { type: 'varchar(255)', config: (col) => col.primaryKey().unique().notNull() },
      uuid: { type: 'varchar(255)', config: (col) => col.notNull().references('user.uuid') },
      public_key: { type: 'varchar(511)', config: (col) => col.notNull() },
      device_name: { type: 'varchar(255)', config: (col) => col.notNull() },
      counter: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
      fp_hash: { type: 'varchar(255)', config: (col) => col.defaultTo('').notNull() },
      created_at: { type: 'bigint', config: (col) => col.defaultTo(nowSql).notNull() },
    },
    turn_state: {
      turn: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
      turn_processing: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
      last_updated_at: { type: 'integer', config: (col) => col.defaultTo(0).notNull() },
    },
  };

  await syncDesiredSchema(db, desiredSchema, isSqlite);
  await dropLegacyRoleTableIfExists(db);
  await createSchemaIndexes(db, isSqlite);
  await ensureTurnStateSeeded(db);
  await seedInitialModerator(db);
}

/**
 * マイグレーションをロールバックする。
 * @param _db - Kyselyインスタンス（未使用）
 */
export async function down(_db: Kysely<unknown>): Promise<void> {
  // down は migrate.ts で直接全テーブル削除しているため、ここでは不要です
}
