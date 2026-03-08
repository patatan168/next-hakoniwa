import META_DATA from '@/global/define/metadata';
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 外部キーを有効化
  await sql`PRAGMA foreign_keys = ON`.execute(db);

  // ---------- user ----------
  await db.schema
    .createTable('user')
    .ifNotExists()
    .addColumn('uuid', 'text', (col) => col.primaryKey().unique().notNull())
    .addColumn('user_name', 'text', (col) => col.notNull())
    .addColumn('island_name', 'text', (col) => col.notNull())
    .addColumn('inhabited', 'integer', (col) => col.defaultTo(1).notNull())
    .execute();

  await sql`CREATE INDEX IF NOT EXISTS user_inhabited_index ON user(inhabited)`.execute(db);

  // ---------- auth ----------
  await db.schema
    .createTable('auth')
    .ifNotExists()
    .addColumn('uuid', 'text', (col) => col.primaryKey().unique().notNull().references('user.uuid'))
    .addColumn('id', 'text', (col) => col.unique().notNull())
    .addColumn('password', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.defaultTo(sql`(unixepoch())`).notNull())
    .addColumn('login_fail_count', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('locked_until', 'datetime')
    .addColumn('fp_hash', 'text', (col) => col.defaultTo('').notNull())
    .execute();

  // ---------- role ----------
  await db.schema
    .createTable('role')
    .ifNotExists()
    .addColumn('uuid', 'text', (col) => col.primaryKey().unique().notNull().references('user.uuid'))
    .addColumn('role', 'integer', (col) => col.defaultTo(0).notNull())
    .execute();

  // ---------- last_login ----------
  await db.schema
    .createTable('last_login')
    .ifNotExists()
    .addColumn('uuid', 'text', (col) => col.primaryKey().unique().notNull().references('user.uuid'))
    .addColumn('last_login_at', 'integer', (col) => col.defaultTo(sql`(unixepoch())`).notNull())
    .addColumn('last_bonus_received_at', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('consecutive_login_days', 'integer', (col) => col.defaultTo(0).notNull())
    .execute();

  // ---------- island ----------
  await db.schema
    .createTable('island')
    .ifNotExists()
    .addColumn('uuid', 'text', (col) => col.primaryKey().unique().notNull().references('user.uuid'))
    .addColumn('prize', 'json', (col) => col.notNull())
    .addColumn('money', 'integer', (col) => col.notNull())
    .addColumn('area', 'integer', (col) => col.notNull())
    .addColumn('population', 'integer', (col) => col.notNull())
    .addColumn('food', 'integer', (col) => col.notNull())
    .addColumn('farm', 'integer', (col) => col.notNull())
    .addColumn('factory', 'integer', (col) => col.notNull())
    .addColumn('mining', 'integer', (col) => col.notNull())
    .addColumn('missile', 'integer', (col) => col.notNull())
    .addColumn('island_info', 'json', (col) => col.notNull())
    .execute();

  await sql`CREATE INDEX IF NOT EXISTS island_population_index ON island(population)`.execute(db); // The original queries used DESC natively but this is enough in basic creation

  // ---------- turn_log ----------
  await db.schema
    .createTable('turn_log')
    .ifNotExists()
    .addColumn('log_uuid', 'text', (col) => col.primaryKey().notNull())
    .addColumn('from_uuid', 'text', (col) => col.notNull().references('user.uuid'))
    .addColumn('to_uuid', 'text', (col) => col.references('user.uuid'))
    .addColumn('turn', 'integer', (col) => col.notNull())
    .addColumn('secret_log', 'text', (col) => col.notNull())
    .addColumn('log', 'text')
    .execute();

  await sql`CREATE INDEX IF NOT EXISTS turn_log_uuid_index ON turn_log(log_uuid DESC)`.execute(db);

  // ---------- plan ----------
  await db.schema
    .createTable('plan')
    .ifNotExists()
    .addColumn('from_uuid', 'text', (col) => col.notNull().references('user.uuid'))
    .addColumn('to_uuid', 'text', (col) => col.notNull().references('user.uuid'))
    .addColumn('plan_no', 'integer', (col) => col.notNull())
    .addColumn('times', 'integer', (col) => col.notNull())
    .addColumn('x', 'integer', (col) => col.notNull())
    .addColumn('y', 'integer', (col) => col.notNull())
    .addColumn('plan', 'text', (col) => col.notNull())
    .execute();

  // ---------- event_rate ----------
  await db.schema
    .createTable('event_rate')
    .ifNotExists()
    .addColumn('uuid', 'text', (col) => col.primaryKey().notNull().references('user.uuid'))
    .addColumn('earthquake', 'real', (col) => col.defaultTo(META_DATA.EARTHQUAKE_RATE).notNull())
    .addColumn('tsunami', 'real', (col) => col.defaultTo(META_DATA.TSUNAMI_RATE).notNull())
    .addColumn('typhoon', 'real', (col) => col.defaultTo(META_DATA.TYPHOON_RATE).notNull())
    .addColumn('meteorite', 'real', (col) => col.defaultTo(META_DATA.METEORITE_RATE).notNull())
    .addColumn('huge_meteorite', 'real', (col) =>
      col.defaultTo(META_DATA.HUGE_METEORITE_RATE).notNull()
    )
    .addColumn('eruption', 'real', (col) => col.defaultTo(META_DATA.ERUPTION_RATE).notNull())
    .addColumn('fire', 'real', (col) => col.defaultTo(META_DATA.FIRE_RATE).notNull())
    .addColumn('buried_treasure', 'real', (col) =>
      col.defaultTo(META_DATA.BURIED_TREASURE_RATE).notNull()
    )
    .addColumn('oil_field', 'real', (col) => col.defaultTo(META_DATA.OIL_FIELD_RATE).notNull())
    .addColumn('oil_exhaustion', 'real', (col) =>
      col.defaultTo(META_DATA.OIL_EXHAUSTION_RATE).notNull()
    )
    .addColumn('fall_down', 'real', (col) => col.defaultTo(META_DATA.FALL_DOWN_RATE).notNull())
    .addColumn('monster', 'real', (col) => col.defaultTo(META_DATA.MONSTER_RATE).notNull())
    .addColumn('propaganda', 'integer', (col) => col.defaultTo(0).notNull())
    .execute();

  // ---------- access_token ----------
  await db.schema
    .createTable('access_token')
    .ifNotExists()
    .addColumn('uuid', 'text', (col) => col.notNull().references('user.uuid'))
    .addColumn('session_id', 'text', (col) => col.notNull())
    .addColumn('public_key', 'text', (col) => col.unique().notNull())
    .addColumn('created_at', 'integer', (col) => col.defaultTo(sql`(unixepoch())`).notNull())
    .addColumn('expires', 'datetime', (col) => col.notNull())
    .execute();

  // ---------- refresh_token ----------
  await db.schema
    .createTable('refresh_token')
    .ifNotExists()
    .addColumn('uuid', 'text', (col) => col.notNull().references('user.uuid'))
    .addColumn('session_id', 'text', (col) => col.notNull())
    .addColumn('public_key', 'text', (col) => col.unique().notNull())
    .addColumn('created_at', 'integer', (col) => col.defaultTo(sql`(unixepoch())`).notNull())
    .addColumn('expires', 'datetime', (col) => col.notNull())
    .execute();

  // ---------- passkey ----------
  await db.schema
    .createTable('passkey')
    .ifNotExists()
    .addColumn('credential_id', 'text', (col) => col.primaryKey().unique().notNull())
    .addColumn('uuid', 'text', (col) => col.notNull().references('user.uuid'))
    .addColumn('public_key', 'text', (col) => col.notNull())
    .addColumn('device_name', 'text', (col) => col.notNull())
    .addColumn('counter', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('fp_hash', 'text', (col) => col.defaultTo('').notNull())
    .addColumn('created_at', 'integer', (col) => col.defaultTo(sql`(unixepoch())`).notNull())
    .execute();

  // ---------- turn_state ----------
  await db.schema
    .createTable('turn_state')
    .ifNotExists()
    .addColumn('turn', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('turn_processing', 'integer', (col) => col.defaultTo(0).notNull())
    .addColumn('last_updated_at', 'integer', (col) => col.defaultTo(0).notNull())
    .execute();

  // 初期化レコード挿入
  const countRes = await sql<{ cnt: number }>`SELECT COUNT(*) as cnt FROM turn_state`.execute(db);
  const count = countRes.rows[0]?.cnt ?? 0;

  if (count === 0) {
    await sql`INSERT INTO turn_state (turn, turn_processing, last_updated_at) VALUES (0, 0, 0)`.execute(
      db
    );
  }
}

export async function down(db: Kysely<unknown>): Promise<void> {
  const tables = [
    'turn_state',
    'passkey',
    'refresh_token',
    'access_token',
    'event_rate',
    'plan',
    'turn_log',
    'island',
    'last_login',
    'role',
    'auth',
    'user',
  ];
  for (const table of tables) {
    await db.schema.dropTable(table).ifExists().execute();
  }
}
