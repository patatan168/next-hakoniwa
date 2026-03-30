/**
 * @module turnProgress
 * @description ターン進行状況のSSE配信処理。
 */
import {
  Database,
  Island,
  islandData,
  islandInfo,
  islandInfoTurnProgress,
  isSqlite,
  parseJsonIslandDataTurnProgress,
  Plan,
  TurnLog,
  User,
} from '@/db/kysely';
import { differenceWith, isEqual } from 'es-toolkit';
import { Kysely, sql, Transaction } from 'kysely';
import {
  getBaseLog,
  logEarthquake,
  logEarthquakeDamage,
  logEruption,
  logEruptionDamageToSea,
  logEruptionDamageToShallows,
  logFallMonument,
  logHugeMeteorite,
  logIslandDeath,
  logLackFoods,
  logLackFoodsDamage,
  logLandSubsidence,
  logLandSubsidenceDamage,
  logMeteorite,
  logMeteoriteToMonster,
  logMeteoriteToMountain,
  logMeteoriteToSea,
  logMeteoriteToShallows,
  logMeteoriteToSubmarineMissile,
  logPopMonster,
  logTsunami,
  logTsunamiDamage,
  logTyphoon,
  logTyphoonDamage,
} from '../define/logType';
import * as mapMonster from '../define/mapCategory/mapMonster';
import { people } from '../define/mapCategory/mapOther';
import { getMapDefine, mapType } from '../define/mapType';
import META_DATA from '../define/metadata';
import { islandDataGetSet, islandDataStore } from '../store/turnProgress';
import {
  accumulateCellStats,
  changeMapData,
  countBaseLandAround,
  countMapAround,
  createIslandStats,
  getMapAround,
  isOpenSea,
  mapArrayConverter,
  wideDamage,
} from './island';
import { arrayRandomInt, checkProbability, randomIntInRange, valueOrSafeLimit } from './utility';
import { createUuid25 } from './uuid';

/**
 * 全島情報の取得
 * @param db DB接続情報
 * @returns 全ユーザー情報
 */
export async function getAllIslands(db: Kysely<Database> | Transaction<Database>) {
  const islands = (await db
    .selectFrom('user')
    .innerJoin('island', 'user.uuid', 'island.uuid')
    .innerJoin('event_rate', 'island.uuid', 'event_rate.uuid')
    .selectAll('user')
    .selectAll('event_rate')
    .select([
      'island.uuid',
      'island.money',
      'island.area',
      'island.population',
      'island.food',
      'island.farm',
      'island.factory',
      'island.mining',
      'island.missile',
      'user.island_name',
    ])
    // SQLite では json() で文字列へ変換が必要だが、MySQL の JSON 型はそのまま取得できる
    .select(
      isSqlite
        ? sql<string>`json(island.island_info)`.as('island_info')
        : sql<string>`island.island_info`.as('island_info')
    )
    .select(sql<string>`island.prize`.as('prize'))
    .where('user.inhabited', '=', 1)
    .execute()) as unknown as islandInfoTurnProgress[];
  if (islands) {
    islands.forEach((island) => parseJsonIslandDataTurnProgress(island, false));
    return islands;
  }
}

/**
 * ユーザーの計画情報を取得
 * @param db DB接続情報
 * @param uuid ユーザーUUID
 * @returns 全ユーザー情報
 */
export async function getUserPlanInfo(db: Kysely<Database> | Transaction<Database>, uuid: string) {
  const plans = await db
    .selectFrom('plan')
    .selectAll()
    .where('from_uuid', '=', uuid)
    .orderBy('plan_no', 'asc')
    .execute();
  return plans;
}

/**
 * ターン情報を取得
 * @param db DB接続情報
 * @returns 全ユーザー情報
 */
export async function getTurnInfo(db: Kysely<Database> | Transaction<Database>) {
  return await db.selectFrom('turn_state').selectAll().executeTakeFirst();
}
/**
 * ターンを更新
 * @param db DB接続情報
 * @param nextTurn 次のターン数
 * @returns 全ユーザー情報
 */
export async function updateTurn(db: Kysely<Database> | Transaction<Database>, nextTurn: number) {
  // DBにはUnix time(秒)を保存する
  await db
    .updateTable('turn_state')
    .set({ turn: nextTurn, last_updated_at: Math.floor(Date.now() / 1000) })
    .execute();
}

/**
 * ターン実行情報の更新
 * @param db DB接続情報
 * @param turnProgress ターン処理中かどうか
 * @returns 全ユーザー情報
 */
export async function updateTurnProgressing(
  db: Kysely<Database> | Transaction<Database>,
  turnProgress: boolean
) {
  await db
    .updateTable('turn_state')
    .set({ turn_processing: turnProgress ? 1 : 0 })
    .execute();
}

/**
 * UUIDごとの島情報の取得
 * @param islandData 全島情報
 * @param uuid UUID
 * @note 引数`islandData`とメモリーを共有
 * @returns UUIDに応じた島情報
 */
export const getIslandData = (islandData: islandInfoTurnProgress[], uuid: string) => {
  return islandData[islandData.findIndex((element) => element.uuid === uuid)];
};

/**
 * イベント発生率の取得
 * @param db DB接続情報
 * @param uuid ユーザーUUID
 * @returns イベント発生率
 */
export const getEventRate = async (db: Kysely<Database> | Transaction<Database>, uuid: string) =>
  await db.selectFrom('event_rate').selectAll().where('uuid', '=', uuid).executeTakeFirst();

/**
 * 島情報の一括更新
 * @param islandData 全島情報
 * @param uuid UUID
 */
export const updateIslands = async (
  db: Kysely<Database> | Transaction<Database>,
  islandData: islandData
) => {
  const CHUNK = 200;

  await db.transaction().execute(async (trx) => {
    for (let i = 0; i < islandData.length; i += CHUNK) {
      const chunk = islandData.slice(i, i + CHUNK);
      const values = chunk.map((tmp) => {
        const islandInfoJson = JSON.stringify(tmp.island_info);
        const islandInfoParam = isSqlite ? sql`jsonb(${islandInfoJson})` : islandInfoJson;
        return sql`(${tmp.uuid}, ${tmp.money}, ${tmp.area}, ${tmp.population}, ${tmp.food}, ${tmp.farm}, ${tmp.factory}, ${tmp.mining}, ${tmp.missile}, ${typeof tmp.prize === 'string' ? tmp.prize : ''}, ${islandInfoParam})`;
      });

      if (isSqlite) {
        await sql`INSERT INTO island (uuid, money, area, population, food, farm, factory, mining, missile, prize, island_info)
          VALUES ${sql.join(values)}
          ON CONFLICT(uuid) DO UPDATE SET
            money = excluded.money,
            area = excluded.area,
            population = excluded.population,
            food = excluded.food,
            farm = excluded.farm,
            factory = excluded.factory,
            mining = excluded.mining,
            missile = excluded.missile,
            prize = excluded.prize,
            island_info = excluded.island_info`.execute(trx);
      } else {
        await sql`INSERT INTO island (uuid, money, area, population, food, farm, factory, mining, missile, prize, island_info)
          VALUES ${sql.join(values)}
          ON DUPLICATE KEY UPDATE
            money = VALUES(money),
            area = VALUES(area),
            population = VALUES(population),
            food = VALUES(food),
            farm = VALUES(farm),
            factory = VALUES(factory),
            mining = VALUES(mining),
            missile = VALUES(missile),
            prize = VALUES(prize),
            island_info = VALUES(island_info)`.execute(trx);
      }
    }
  });
};

/**
 * 島を放棄する。ユーザー・島・賞品データを削除する。
 * @param client - DBクライアント
 * @param uuid - 対象島UUID
 */
export const abandonIsland = async (
  client: Kysely<Database> | Transaction<Database>,
  uuid: string
) => {
  await client.updateTable('user').set({ inhabited: 0 }).where('uuid', '=', uuid).execute();
  await client.deleteFrom('island').where('uuid', '=', uuid).execute();
  await client.deleteFrom('prize').where('uuid', '=', uuid).execute();
  await client.deleteFrom('event_rate').where('uuid', '=', uuid).execute();
  await client
    .deleteFrom('plan')
    .where((eb) => eb.or([eb('from_uuid', '=', uuid), eb('to_uuid', '=', uuid)]))
    .execute();
  await client.deleteFrom('access_token').where('uuid', '=', uuid).execute();
  await client.deleteFrom('missile_stats').where('uuid', '=', uuid).execute();
  await client.deleteFrom('missile_destroy_map_stats').where('uuid', '=', uuid).execute();
  await client.deleteFrom('missile_kill_monster_stats').where('uuid', '=', uuid).execute();
  await client.deleteFrom('plan_stats').where('uuid', '=', uuid).execute();
  await client.deleteFrom('turn_resource_history').where('uuid', '=', uuid).execute();
  await client.deleteFrom('auth').where('uuid', '=', uuid).execute();
  await client.deleteFrom('last_login').where('uuid', '=', uuid).execute();
  await client.deleteFrom('refresh_token').where('uuid', '=', uuid).execute();
};

/**
 * 複数の島を一括放棄
 * @param client DB接続情報
 * @param uuids 放棄する島のUUID配列
 */
const abandonIslands = async (
  client: Kysely<Database> | Transaction<Database>,
  uuids: string[]
) => {
  if (uuids.length === 0) return;
  await client.updateTable('user').set({ inhabited: 0 }).where('uuid', 'in', uuids).execute();
  await client.deleteFrom('island').where('uuid', 'in', uuids).execute();
  await client.deleteFrom('prize').where('uuid', 'in', uuids).execute();
  await client.deleteFrom('event_rate').where('uuid', 'in', uuids).execute();
  await client
    .deleteFrom('plan')
    .where((eb) => eb.or([eb('from_uuid', 'in', uuids), eb('to_uuid', 'in', uuids)]))
    .execute();
  await client.deleteFrom('access_token').where('uuid', 'in', uuids).execute();
  await client.deleteFrom('missile_stats').where('uuid', 'in', uuids).execute();
  await client.deleteFrom('missile_destroy_map_stats').where('uuid', 'in', uuids).execute();
  await client.deleteFrom('missile_kill_monster_stats').where('uuid', 'in', uuids).execute();
  await client.deleteFrom('plan_stats').where('uuid', 'in', uuids).execute();
  await client.deleteFrom('turn_resource_history').where('uuid', 'in', uuids).execute();
  await client.deleteFrom('auth').where('uuid', 'in', uuids).execute();
  await client.deleteFrom('last_login').where('uuid', 'in', uuids).execute();
  await client.deleteFrom('refresh_token').where('uuid', 'in', uuids).execute();
};

/**
 * ユーザーの生存フラグを更新
 * @param db DB接続情報
 * @param islandData 全島情報
 */
export const updateUserInhabited = async (
  db: Kysely<Database> | Transaction<Database>,
  islandData: (Island & Pick<User, 'island_name'>)[],
  logArray: TurnLog[],
  turn: number
) => {
  const deadIslands = islandData.filter((island) => island.population <= 0);
  if (deadIslands.length === 0) return;

  await db.transaction().execute(async (trx) => {
    // 一括放棄
    await abandonIslands(
      trx,
      deadIslands.map((i) => i.uuid)
    );
    // 個別の無人化ログ
    for (const island of deadIslands) {
      logArray.push({
        log_uuid: createUuid25(),
        from_uuid: island.uuid,
        to_uuid: null,
        turn: turn + 1,
        secret_log: '',
        log: logIslandDeath(island),
      });
    }
  });
};

/**
 * 島情報の一括更新
 * @param islandData 全島情報
 * @param logData ログ情報
 */
export const insertLogs = async (
  db: Kysely<Database> | Transaction<Database>,
  logData: TurnLog[]
) => {
  if (logData.length === 0) return;
  try {
    await db.transaction().execute(async (trx) => {
      const chunkSize = 500;
      for (let i = 0; i < logData.length; i += chunkSize) {
        await trx
          .insertInto('turn_log')
          .values(logData.slice(i, i + chunkSize))
          .execute();
      }
    });
  } catch (e) {
    throw new Error(`ログの挿入に失敗しました。message: ${(e as Error).message}`);
  }
};

/**
 * ミサイル統計をDBに保存（upsert）
 * @param db DB接続情報
 * @param stats uuid -> {monsterKill, cityKill} のマップ
 */
export const saveMissileStats = async (
  db: Kysely<Database> | Transaction<Database>,
  stats: Map<
    string,
    {
      monsterKill: number;
      cityKill: number;
      destroyedMaps: Record<string, number>;
      killedMonsters: Record<string, number>;
    }
  >
): Promise<void> => {
  if (stats.size === 0) return;

  const mainRows: Array<{ uuid: string; monsterKill: number; cityKill: number }> = [];
  const destroyRows: Array<{ uuid: string; mapType: string; count: number }> = [];
  const killRows: Array<{ uuid: string; monsterType: string; count: number }> = [];

  for (const [uuid, { monsterKill, cityKill, destroyedMaps, killedMonsters }] of stats) {
    if (monsterKill > 0 || cityKill > 0) {
      mainRows.push({ uuid, monsterKill, cityKill });
    }
    for (const [mapType, count] of Object.entries(destroyedMaps)) {
      if (count > 0) destroyRows.push({ uuid, mapType, count });
    }
    for (const [monsterType, count] of Object.entries(killedMonsters)) {
      if (count > 0) killRows.push({ uuid, monsterType, count });
    }
  }

  const CHUNK = 200;

  // missile_stats バッチ upsert
  for (let i = 0; i < mainRows.length; i += CHUNK) {
    const chunk = mainRows.slice(i, i + CHUNK);
    if (isSqlite) {
      const values = chunk.map((r) => sql`(${r.uuid}, ${r.monsterKill}, ${r.cityKill})`);
      await sql`INSERT INTO missile_stats (uuid, monster_kill, city_kill)
        VALUES ${sql.join(values)}
        ON CONFLICT(uuid) DO UPDATE SET
          monster_kill = monster_kill + excluded.monster_kill,
          city_kill = city_kill + excluded.city_kill`.execute(db);
    } else {
      const values = chunk.map((r) => sql`(${r.uuid}, ${r.monsterKill}, ${r.cityKill})`);
      await sql`INSERT INTO missile_stats (uuid, monster_kill, city_kill)
        VALUES ${sql.join(values)}
        ON DUPLICATE KEY UPDATE
          monster_kill = monster_kill + VALUES(monster_kill),
          city_kill = city_kill + VALUES(city_kill)`.execute(db);
    }
  }

  // missile_destroy_map_stats バッチ upsert
  for (let i = 0; i < destroyRows.length; i += CHUNK) {
    const chunk = destroyRows.slice(i, i + CHUNK);
    if (isSqlite) {
      const values = chunk.map((r) => sql`(${r.uuid}, ${r.mapType}, ${r.count})`);
      await sql`INSERT INTO missile_destroy_map_stats (uuid, map_type, count)
        VALUES ${sql.join(values)}
        ON CONFLICT(uuid, map_type) DO UPDATE SET count = count + excluded.count`.execute(db);
    } else {
      const values = chunk.map((r) => sql`(${r.uuid}, ${r.mapType}, ${r.count})`);
      await sql`INSERT INTO missile_destroy_map_stats (uuid, map_type, \`count\`)
        VALUES ${sql.join(values)}
        ON DUPLICATE KEY UPDATE \`count\` = \`count\` + VALUES(\`count\`)`.execute(db);
    }
  }

  // missile_kill_monster_stats バッチ upsert
  for (let i = 0; i < killRows.length; i += CHUNK) {
    const chunk = killRows.slice(i, i + CHUNK);
    if (isSqlite) {
      const values = chunk.map((r) => sql`(${r.uuid}, ${r.monsterType}, ${r.count})`);
      await sql`INSERT INTO missile_kill_monster_stats (uuid, monster_type, count)
        VALUES ${sql.join(values)}
        ON CONFLICT(uuid, monster_type) DO UPDATE SET count = count + excluded.count`.execute(db);
    } else {
      const values = chunk.map((r) => sql`(${r.uuid}, ${r.monsterType}, ${r.count})`);
      await sql`INSERT INTO missile_kill_monster_stats (uuid, monster_type, \`count\`)
        VALUES ${sql.join(values)}
        ON DUPLICATE KEY UPDATE \`count\` = \`count\` + VALUES(\`count\`)`.execute(db);
    }
  }
};

/**
 * 成功した計画の統計をDBに保存（upsert）
 * @param db DB接続情報
 * @param stats uuid -> (planType -> successCount) のマップ
 */
export const savePlanStats = async (
  db: Kysely<Database> | Transaction<Database>,
  stats: Map<string, Map<string, number>>
): Promise<void> => {
  if (stats.size === 0) return;

  const rows: Array<{ uuid: string; plan: string; count: number }> = [];
  for (const [uuid, planCounts] of stats) {
    for (const [plan, count] of planCounts) {
      rows.push({ uuid, plan, count });
    }
  }
  if (rows.length === 0) return;

  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    if (isSqlite) {
      const values = chunk.map((r) => sql`(${r.uuid}, ${r.plan}, ${r.count})`);
      await sql`INSERT INTO plan_stats (uuid, plan, count) VALUES ${sql.join(values)}
        ON CONFLICT(uuid, plan) DO UPDATE SET count = count + excluded.count`.execute(db);
    } else {
      const values = chunk.map((r) => sql`(${r.uuid}, ${r.plan}, ${r.count})`);
      await sql`INSERT INTO plan_stats (uuid, plan, \`count\`) VALUES ${sql.join(values)}
        ON DUPLICATE KEY UPDATE \`count\` = \`count\` + VALUES(\`count\`)`.execute(db);
    }
  }
};

/**
 * 計画の挿入と削除
 * @param db DB接続情報
 * @param updatePlan 更新する計画情報
 * @param deleteLength 削除する計画の数
 * @param uuid ユーザーUUID
 */
export const insertDeletePlan = async (
  db: Kysely<Database> | Transaction<Database>,
  updatePlan: Plan[],
  deleteLength: number,
  uuid: string
) => {
  await db.transaction().execute(async (trx) => {
    // 計画の削除
    await trx.deleteFrom('plan').where('from_uuid', '=', uuid).execute();

    // 計画の挿入
    const insertPlans = updatePlan.map((tmp) => ({ ...tmp, plan_no: tmp.plan_no - deleteLength }));
    if (insertPlans.length > 0) {
      await trx.insertInto('plan').values(insertPlans).execute();
    }
  });
};

/**
 * 計画の一括挿入・削除（バッチ処理）
 * @param db DB接続情報
 * @param deferred 遅延書き込みデータの配列
 */
export const batchInsertDeletePlans = async (
  db: Kysely<Database> | Transaction<Database>,
  deferred: { uuid: string; plans: Plan[]; deleteLength: number }[]
) => {
  if (deferred.length === 0) return;
  await db.transaction().execute(async (trx) => {
    // 全対象UUIDの計画を一括削除
    const uuids = deferred.map((d) => d.uuid);
    for (let i = 0; i < uuids.length; i += 900) {
      await trx
        .deleteFrom('plan')
        .where('from_uuid', 'in', uuids.slice(i, i + 900))
        .execute();
    }

    // 全計画を一括挿入
    const allInserts = deferred.flatMap((d) =>
      d.plans.map((p) => ({ ...p, plan_no: p.plan_no - d.deleteLength }))
    );
    for (let i = 0; i < allInserts.length; i += 500) {
      await trx
        .insertInto('plan')
        .values(allInserts.slice(i, i + 500))
        .execute();
    }
  });
};

/**
 * 地震で破壊されるマップの判定
 * @param islandInfo 島情報
 * @returns 地震で破壊されるマップかどうか
 */
const isEarthquakeDamageMap = (islandInfo: islandInfo) => {
  // 都市は人の数が一定以上であること
  const isCity =
    islandInfo.type === 'people' &&
    islandInfo.landValue >= valueOrSafeLimit(people.level?.[2], 'max');

  return isCity || islandInfo.type === 'fake_defense_base' || islandInfo.type === 'factory';
};

/**
 * 地震イベントの実行
 * @param islandUuid 島のUuid
 * @param turn ターン数
 * @returns 地震のログ配列
 */
export const earthquakeExecute = (islandUuid: string, turn: number) => {
  using fromIslandGetSet = islandDataGetSet(islandUuid);
  const island = fromIslandGetSet.islandData;
  if (!island) throw new Error(`島情報が見つかりません。uuid=${islandUuid}`);

  if (checkProbability(island.earthquake as unknown as number)) {
    const baseLog = () => getBaseLog(turn, island);
    const earthquakeLog = logEarthquake(island);
    const earthquakeLogs: TurnLog[] = [
      { ...baseLog(), log: earthquakeLog, secret_log: earthquakeLog },
    ];
    for (const islandInfo of island.island_info) {
      if (isEarthquakeDamageMap(islandInfo)) {
        // 都市やハリボテ、防衛施設、工場は地震で破壊される
        if (checkProbability(META_DATA.EARTHQUAKE_DESTROY_RATE)) {
          const log = logEarthquakeDamage(island, islandInfo.x, islandInfo.y);
          earthquakeLogs.push({ ...baseLog(), log: log, secret_log: log });
          changeMapData(island, islandInfo.x, islandInfo.y, 'wasteland', { type: 'ins', value: 0 });
        }
      }
    }
    return earthquakeLogs;
  }
};

/**
 * 食料不足で破壊されるマップの判定
 * @param islandInfo 島情報
 * @returns 食料不足で破壊されるマップかどうか
 */
const isLackFoodsDamageMap = (islandInfo: islandInfo) => {
  switch (islandInfo.type) {
    case 'factory':
    case 'farm':
    case 'missile':
    case 'defense_base':
      return true;
    default:
      return false;
  }
};

/**
 * 食料不足イベントの実行
 * @param islandUuid 島のUuid
 * @param turn ターン数
 * @returns 食料不足のログ配列
 */
export const lackFoodsExecute = (islandUuid: string, turn: number) => {
  using fromIslandGetSet = islandDataGetSet(islandUuid);
  const island = fromIslandGetSet.islandData;
  if (!island) throw new Error(`島情報が見つかりません。uuid=${islandUuid}`);

  if (island.food <= 0) {
    const lackFoodsLog = logLackFoods(island);
    const baseLog = () => getBaseLog(turn, island);
    const lackFoodsLogs: TurnLog[] = [
      { ...baseLog(), log: lackFoodsLog, secret_log: lackFoodsLog },
    ];
    for (const islandInfo of island.island_info) {
      if (isLackFoodsDamageMap(islandInfo)) {
        if (checkProbability(META_DATA.LACK_FOOD_DESTROY_RATE)) {
          const log = logLackFoodsDamage(island, islandInfo.x, islandInfo.y);
          lackFoodsLogs.push({ ...baseLog(), log: log, secret_log: log });
          changeMapData(island, islandInfo.x, islandInfo.y, 'wasteland', { type: 'ins', value: 0 });
        }
      }
    }
    // 0に正規化
    island.food = 0;

    return lackFoodsLogs;
  }
};

/**
 * 津波で破壊されるマップの判定
 * @param islandInfo 島情報
 * @returns 津波で破壊されるマップかどうか
 */
const isTsunamiDamageMap = (islandInfo: islandInfo) => {
  switch (islandInfo.type) {
    case 'people':
    case 'factory':
    case 'farm':
    case 'missile':
    case 'defense_base':
    case 'fake_defense_base':
      return true;
    default:
      return false;
  }
};

/**
 * 津波で破壊されるマップの判定
 * @param islandData 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 津波で破壊されるか
 */
const tsunamiDestroyRate = (islandData: islandInfo[], x: number, y: number) => {
  const seaCount = countBaseLandAround(islandData, 'sea', x, y, 1);
  return randomIntInRange(1, 12) < seaCount;
};

/**
 * 津波イベントの実行
 * @param islandUuid 島のUuid
 * @param turn ターン数
 * @returns 津波のログ配列
 */
export const tsunamiExecute = (islandUuid: string, turn: number) => {
  using fromIslandGetSet = islandDataGetSet(islandUuid);
  const island = fromIslandGetSet.islandData;
  if (!island) throw new Error(`島情報が見つかりません。uuid=${islandUuid}`);

  if (checkProbability(island.tsunami)) {
    const baseLog = () => getBaseLog(turn, island);
    const tsunamiLog = logTsunami(island);
    const tsunamiLogs: TurnLog[] = [{ ...baseLog(), log: tsunamiLog, secret_log: tsunamiLog }];
    for (const islandInfo of island.island_info) {
      if (isTsunamiDamageMap(islandInfo)) {
        if (tsunamiDestroyRate(island.island_info, islandInfo.x, islandInfo.y)) {
          const log = logTsunamiDamage(island, islandInfo.x, islandInfo.y);
          tsunamiLogs.push({ ...baseLog(), log: log, secret_log: log });
          changeMapData(island, islandInfo.x, islandInfo.y, 'wasteland', { type: 'ins', value: 0 });
        }
      }
    }
    return tsunamiLogs;
  }
};

/**
 * モンスター出現のためのモンスター配列を取得
 * @param population 人口
 * @returns モンスター配列
 */
const getPopMonsterArray = (population: number) => {
  if (population >= META_DATA.MONSTER_POP_BORDER_3) {
    return [
      mapMonster.inora,
      mapMonster.sanjira,
      mapMonster.redInora,
      mapMonster.darkInora,
      mapMonster.inoraGhost,
      mapMonster.kujira,
      mapMonster.kingInora,
    ];
  }

  if (population >= META_DATA.MONSTER_POP_BORDER_2) {
    return [
      mapMonster.inora,
      mapMonster.sanjira,
      mapMonster.redInora,
      mapMonster.darkInora,
      mapMonster.inoraGhost,
    ];
  }

  if (population >= META_DATA.MONSTER_POP_BORDER_1) {
    return [mapMonster.inora, mapMonster.sanjira];
  }

  return [];
};

/**
 * モンスターを出現させる
 * @param island 島情報
 * @param popMonsterType 出現させるモンスターの種類
 * @param turn ターン数
 * @param exeNum 実行数
 */
const popMonster = (
  island: islandInfoTurnProgress,
  popMonsterType: mapType,
  turn: number,
  exeNum = 1
) => {
  const logs = [];
  const baseLog = () => getBaseLog(turn, island);
  const islandInfoFindPeople = island.island_info.filter(
    (info: islandInfo) => info.type === 'people'
  );
  // NOTE: 実行数か都市数のどちらか小さい方を出現数とする
  const popNum = Math.min(exeNum, islandInfoFindPeople.length);
  const arrayNum = arrayRandomInt(popNum);

  for (let i = 0; i < popNum; i++) {
    const islandInfoNum = mapArrayConverter(
      islandInfoFindPeople[arrayNum[i]].x,
      islandInfoFindPeople[arrayNum[i]].y
    );
    const islandInfo = island.island_info[islandInfoNum];
    const beforePopMapInfo = { ...islandInfo };
    const monsterLevel = randomIntInRange(popMonsterType.defVal, popMonsterType.maxVal);
    changeMapData(island, islandInfo.x, islandInfo.y, popMonsterType.type, {
      type: 'ins',
      value: monsterLevel,
    });
    const log = logPopMonster(island, popMonsterType, islandInfo.x, islandInfo.y, beforePopMapInfo);
    logs.push({ ...baseLog(), log: log, secret_log: log });
  }
  return logs;
};

/**
 * モンスター出現イベントの実行
 * @param islandUuid 島のUuid
 * @param turn ターン数
 * @returns 津波のログ配列
 */
export const popMonsterExecute = (islandUuid: string, turn: number) => {
  using fromIslandGetSet = islandDataGetSet(islandUuid);
  const island = fromIslandGetSet.islandData;
  if (!island) throw new Error(`島情報が見つかりません。uuid=${islandUuid}`);

  if (island.artificialMonster > 0) {
    // 怪獣派遣がされている場合は、メカいのらを出現させる
    return popMonster(island, mapMonster.mekaInora, turn, island.artificialMonster);
  }

  // 怪獣派遣がされていない場合は、人口に応じたモンスターを出現させる
  const monsterArray = getPopMonsterArray(island.population);
  if (monsterArray.length === 0) return;

  if (checkProbability((island.monster * island.area) / 100)) {
    const popMonsterType = monsterArray[randomIntInRange(0, monsterArray.length - 1)];
    return popMonster(island, popMonsterType, turn);
  }
};

/**
 * 地盤沈下で破壊されるマップの判定
 * @param islandInfo 島情報
 * @returns 地盤地下で破壊されるマップかどうか
 */
const isLandSubsidenceDamageMap = (islandInfo: islandInfo) => {
  const mapDef = getMapDefine(islandInfo.type);
  switch (mapDef.baseLand) {
    case 'sea':
    case 'mountain':
      return false;
    default:
      return true;
  }
};

/**
 * 地盤沈下で破壊されるマップの判定
 * @param islandData 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 地盤地下で破壊されるか
 */
const isLandSubsidenceDestroyAround = (islandData: islandInfo[], x: number, y: number) => {
  const seaCount = countBaseLandAround(islandData, 'sea', x, y, 1);

  return 0 < seaCount;
};

/**
 * 地盤沈下イベントの実行
 * @param islandUuid 島のUuid
 * @param turn ターン数
 * @returns 地盤沈下のログ配列
 */
export const landSubsidenceExecute = (islandUuid: string, turn: number) => {
  using fromIslandGetSet = islandDataGetSet(islandUuid);
  const island = fromIslandGetSet.islandData;
  if (!island) throw new Error(`島情報が見つかりません。uuid=${islandUuid}`);

  if (island.area > META_DATA.FALL_DOWN_BORDER && checkProbability(island.fall_down)) {
    const baseLog = () => getBaseLog(turn, island);
    const landSubsidenceLog = logLandSubsidence(island);
    const landSubsidenceLogs: TurnLog[] = [
      { ...baseLog(), log: landSubsidenceLog, secret_log: landSubsidenceLog },
    ];
    for (const islandInfo of island.island_info) {
      if (isLandSubsidenceDamageMap(islandInfo)) {
        if (isLandSubsidenceDestroyAround(island.island_info, islandInfo.x, islandInfo.y)) {
          const log = logLandSubsidenceDamage(island, islandInfo.x, islandInfo.y);
          landSubsidenceLogs.push({ ...baseLog(), log: log, secret_log: log });
          // 浅瀬なら海へ、それ以外は浅瀬へ変更
          if (islandInfo.type === 'shallows') {
            changeMapData(island, islandInfo.x, islandInfo.y, 'sea', { type: 'ins', value: 0 });
          } else {
            changeMapData(island, islandInfo.x, islandInfo.y, 'shallows', {
              type: 'ins',
              value: 0,
            });
          }
        }
      }
    }
    return landSubsidenceLogs;
  }
};

/**
 * 台風で破壊されるマップの判定
 * @param islandInfo 島情報
 * @returns 台風で破壊されるマップかどうか
 */
const isTyphoonDamageMap = (islandInfo: islandInfo) => {
  switch (islandInfo.type) {
    case 'farm':
    case 'fake_defense_base':
      return true;
    default:
      return false;
  }
};

/**
 * 台風イベントの実行
 * @param islandUuid 島のUuid
 * @param turn ターン数
 * @return 台風のログ配列
 */
export function typhoonExecute(islandUuid: string, turn: number) {
  using fromIslandGetSet = islandDataGetSet(islandUuid);
  const island = fromIslandGetSet.islandData;
  if (!island) throw new Error(`島情報が見つかりません。uuid=${islandUuid}`);

  if (checkProbability(island.typhoon)) {
    const baseLog = () => getBaseLog(turn, island);
    const typhoonLog = logTyphoon(island);
    const typhoonLogs: TurnLog[] = [{ ...baseLog(), log: typhoonLog, secret_log: typhoonLog }];
    for (const islandInfo of island.island_info) {
      if (isTyphoonDamageMap(islandInfo)) {
        // 台風のログを作成
        const forestNum = countMapAround(
          island.island_info,
          'forest',
          islandInfo.x,
          islandInfo.y,
          1
        );
        const monumentNum = countMapAround(
          island.island_info,
          'monument',
          islandInfo.x,
          islandInfo.y,
          1
        );
        const baseLog = getBaseLog(turn, island);
        if (forestNum === 0 && monumentNum === 0) {
          // 台風の被害
          const log = logTyphoonDamage(island, islandInfo.x, islandInfo.y);
          changeMapData(island, islandInfo.x, islandInfo.y, 'plains', { type: 'ins', value: 0 });
          typhoonLogs.push({ ...baseLog, log: log, secret_log: log });
        }
      }
    }
    return typhoonLogs;
  }
}

/**
 * 巨大隕石イベントの実行
 * @param islandUuid 島のUuid
 * @param turn ターン数
 * @returns 地盤沈下のログ配列
 */
export const hugeMeteoriteExecute = (islandUuid: string, turn: number) => {
  const island = islandDataStore.getState().islandGet(islandUuid);
  if (!island) throw new Error(`島情報が見つかりません。uuid=${islandUuid}`);

  if (checkProbability(island.huge_meteorite)) {
    const baseLog = () => getBaseLog(turn, island);
    const meteoriteX = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const meteoriteY = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const hugeMeteoriteLog = logHugeMeteorite(island, meteoriteX, meteoriteY);
    const hugeMeteoriteLogs: TurnLog[] = [
      { ...baseLog(), log: hugeMeteoriteLog, secret_log: hugeMeteoriteLog },
    ];
    // 巨大隕石落下
    hugeMeteoriteLogs.push(...wideDamage(islandUuid, meteoriteX, meteoriteY, turn));

    return hugeMeteoriteLogs;
  }
};

/**
 * モノリス落下のログを作成
 * @param islandUuid 島のUuid
 * @param x X座標
 * @param y Y座標
 * @returns モノリス落下のログ
 */
export const monumentAttackExecute = (islandUuid: string, turn: number) => {
  const island = islandDataStore.getState().islandGet(islandUuid);
  if (!island) throw new Error(`島情報が見つかりません。uuid=${islandUuid}`);

  if (island.fallMonument <= 0) return;

  const allLogs: TurnLog[] = [];
  for (let i = 0; i < island.fallMonument; i++) {
    const baseLog = getBaseLog(turn, island);
    const monumentX = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const monumentY = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const fallMonumentLog = logFallMonument(island, monumentX, monumentY);
    allLogs.push({ ...baseLog, log: fallMonumentLog, secret_log: fallMonumentLog });
    // モノリス落下
    const wideDamageLogs = wideDamage(islandUuid, monumentX, monumentY, turn);
    allLogs.push(...wideDamageLogs);
  }

  return allLogs;
};

/**
 * 隕石イベントの実行
 * @param islandUuid 島のUuid
 * @param turn ターン数
 * @returns 隕石のログ
 */
export const meteoriteExecute = (islandUuid: string, turn: number) => {
  using fromIslandGetSet = islandDataGetSet(islandUuid);
  const island = fromIslandGetSet.islandData;
  if (!island) throw new Error(`島情報が見つかりません。uuid=${islandUuid}`);

  if (checkProbability(island.meteorite)) {
    const baseLog = () => getBaseLog(turn, island);
    const landSubsidenceLogs: TurnLog[] = [];
    let meteoriteFlag = true;
    // 隕石落下
    while (meteoriteFlag) {
      const x = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
      const y = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
      let meteoriteLog = '';
      const islandInfo = island.island_info[mapArrayConverter(x, y)];
      const mapDef = getMapDefine(islandInfo.type);
      switch (mapDef.baseLand) {
        case 'sea': {
          switch (islandInfo.type) {
            case 'submarine_missile': {
              // 海底ミサイルは海に変更
              meteoriteLog = logMeteoriteToSubmarineMissile(island, x, y);
              changeMapData(island, x, y, 'sea', { type: 'ins', value: 0 });
              break;
            }
            default: {
              meteoriteLog = logMeteoriteToSea(island, x, y);
              break;
            }
          }
          break;
        }
        case 'mountain': {
          meteoriteLog = logMeteoriteToMountain(island, x, y);
          changeMapData(island, x, y, 'ruins', { type: 'ins', value: 0 });
          break;
        }
        case 'shallows': {
          meteoriteLog = logMeteoriteToShallows(island, x, y);
          // 浅瀬は海に変更
          changeMapData(island, x, y, 'sea', { type: 'ins', value: 0 });
          break;
        }
        case 'monster':
        case 'sanjira':
        case 'kujira': {
          meteoriteLog = logMeteoriteToMonster(island, x, y);
          changeMapData(island, x, y, 'shallows', { type: 'ins', value: 0 });
          break;
        }
        default: {
          meteoriteLog = logMeteorite(island, x, y);
          // その他の地形は浅瀬に変更
          changeMapData(island, x, y, 'shallows', {
            type: 'ins',
            value: 0,
          });
          break;
        }
      }
      // 隕石落下ログ
      landSubsidenceLogs.push({ ...baseLog(), log: meteoriteLog, secret_log: meteoriteLog });
      // 隕石継続判定
      meteoriteFlag = checkProbability(META_DATA.CONTINUOUS_METEORITE_RATE);
    }
    return landSubsidenceLogs;
  }
};

/**
 * 噴火イベントの実行
 * @param islandUuid 島のUuid
 * @param turn ターン数
 * @returns 噴火のログ
 */
export const eruptionExecute = (islandUuid: string, turn: number) => {
  using fromIslandGetSet = islandDataGetSet(islandUuid);
  const island = fromIslandGetSet.islandData;
  if (!island) throw new Error(`島情報が見つかりません。uuid=${islandUuid}`);

  if (checkProbability(island.eruption)) {
    const x = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const y = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const eruptionLogs: TurnLog[] = [];

    const baseLog = () => getBaseLog(turn, island);
    const eruptionLog = logEruption(island, x, y);
    eruptionLogs.push({ ...baseLog(), secret_log: eruptionLog, log: eruptionLog });
    changeMapData(island, x, y, 'mountain', { type: 'ins', value: 0 });

    // 周囲1HEXのみ
    const aroundHex1 = differenceWith(getMapAround(x, y, 1), [{ x, y }], isEqual);
    aroundHex1.forEach(({ x: changeX, y: changeY }) => {
      if (!isOpenSea(changeX, changeY)) {
        const mapInfo = island.island_info[mapArrayConverter(changeX, changeY)];
        const mapDefine = getMapDefine(mapInfo.type);
        switch (mapDefine.baseLand) {
          case 'shallows': {
            const tmpLog = logEruptionDamageToShallows(island, changeX, changeY);
            eruptionLogs.push({ ...baseLog(), secret_log: tmpLog, log: tmpLog });
            changeMapData(island, changeX, changeY, 'wasteland', { type: 'ins', value: 0 });
            break;
          }
          case 'sea': {
            const tmpLog = logEruptionDamageToSea(island, changeX, changeY);
            eruptionLogs.push({ ...baseLog(), secret_log: tmpLog, log: tmpLog });
            changeMapData(island, changeX, changeY, 'shallows', { type: 'ins', value: 0 });
            break;
          }
          case 'mountain':
          case 'monster':
          case 'sanjira':
          case 'kujira':
            break;
          default: {
            if (mapInfo.type !== 'ruins' && mapInfo.type !== 'wasteland') {
              const tmpLog = logEarthquakeDamage(island, changeX, changeY);
              eruptionLogs.push({ ...baseLog(), secret_log: tmpLog, log: tmpLog });
              changeMapData(island, changeX, changeY, 'wasteland', { type: 'ins', value: 0 });
              break;
            }
          }
        }
      }
    });
    return eruptionLogs;
  }
};

/**
 * 島の全統計情報を設定する
 * @param uuid 島のUUID
 */
export const setAllIslandStats = (uuid: string) => {
  using island = islandDataGetSet(uuid);
  const islandData = island.islandData;
  if (!islandData) return;

  const data = islandData.island_info;
  const stats = createIslandStats();
  const typeCache: Record<string, mapType> = {};

  for (let i = 0; i < data.length; i++) {
    const islandInfo = data[i];

    let mapDef = typeCache[islandInfo.type];
    if (!mapDef) {
      mapDef = getMapDefine(islandInfo.type);
      typeCache[islandInfo.type] = mapDef;
    }

    accumulateCellStats(islandInfo, mapDef, stats);
  }

  // 統計情報の反映
  islandData.area = stats.area;
  islandData.population = stats.population;
  islandData.farm = stats.farm;
  islandData.factory = stats.factory;
  islandData.mining = stats.mining;
  islandData.missile = stats.missile;
};
