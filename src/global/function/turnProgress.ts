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
  await db.transaction().execute(async (trx) => {
    for (const tmp of islandData) {
      // island_infoのみJSONとして保存する
      const islandInfoJson = JSON.stringify(tmp.island_info);
      const islandInfoSql = isSqlite
        ? sql<string>`jsonb(${islandInfoJson})`
        : sql<string>`${islandInfoJson}`;

      await trx
        .updateTable('island')
        .set({
          prize: typeof tmp.prize === 'string' ? tmp.prize : '',
          money: tmp.money,
          area: tmp.area,
          population: tmp.population,
          food: tmp.food,
          farm: tmp.farm,
          factory: tmp.factory,
          mining: tmp.mining,
          missile: tmp.missile,
          island_info: islandInfoSql,
        })
        .where('uuid', '=', tmp.uuid)
        .execute();
    }
  });
};

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
  await client.deleteFrom('auth').where('uuid', '=', uuid).execute();
  await client.deleteFrom('last_login').where('uuid', '=', uuid).execute();
  await client.deleteFrom('refresh_token').where('uuid', '=', uuid).execute();
  await client.deleteFrom('role').where('uuid', '=', uuid).execute();
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
    for (const island of deadIslands) {
      await abandonIsland(trx, island.uuid);
      // 無人化ログ
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
 * 成功した計画の統計をDBに保存（upsert）
 * @param db DB接続情報
 * @param stats uuid -> (planType -> successCount) のマップ
 */
export const savePlanStats = async (
  db: Kysely<Database> | Transaction<Database>,
  stats: Map<string, Map<string, number>>
): Promise<void> => {
  if (stats.size === 0) return;

  for (const [uuid, planCounts] of stats) {
    for (const [plan, count] of planCounts) {
      if (isSqlite) {
        await sql`INSERT INTO plan_stats (uuid, plan, count) VALUES (${uuid}, ${plan}, ${count})
          ON CONFLICT(uuid, plan) DO UPDATE SET count = count + ${count}`.execute(db);
      } else {
        await sql`INSERT INTO plan_stats (uuid, plan, \`count\`) VALUES (${uuid}, ${plan}, ${count})
          ON DUPLICATE KEY UPDATE \`count\` = \`count\` + VALUES(\`count\`)`.execute(db);
      }
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
 * 食糧不足で破壊されるマップの判定
 * @param islandInfo 島情報
 * @returns 食糧不足で破壊されるマップかどうか
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
 * 食糧不足イベントの実行
 * @param islandUuid 島のUuid
 * @param turn ターン数
 * @returns 食糧不足のログ配列
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
  const monsterArray: mapType[] =
    Object.entries(mapMonster)
      .map(([_, value]) => ({ ...value }))
      .filter((map) => population >= valueOrSafeLimit(map.minPopPopulation, 'max')) ?? [];
  return monsterArray;
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
    const monsterLevel = randomIntInRange(popMonsterType.defVal, popMonsterType.maxVal);
    changeMapData(island, islandInfo.x, islandInfo.y, popMonsterType.type, {
      type: 'ins',
      value: monsterLevel,
    });
    const log = logPopMonster(island, popMonsterType, islandInfo.x, islandInfo.y);
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
  } else if (checkProbability((island.monster * island.area) / 100)) {
    // 怪獣派遣がされていない場合は、人口に応じたモンスターを出現させる
    const monsterArray = getPopMonsterArray(island.population);
    if (monsterArray.length > 0) {
      const popMonsterType = monsterArray[randomIntInRange(0, monsterArray.length - 1)];
      return popMonster(island, popMonsterType, turn);
    }
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

  for (let i = 0; i < island.fallMonument; i++) {
    const baseLog = getBaseLog(turn, island);
    const monumentX = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const monumentY = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const fallMonumentLog = logFallMonument(island, monumentX, monumentY);
    const monumentAttackLogs: TurnLog[] = [
      { ...baseLog, log: fallMonumentLog, secret_log: fallMonumentLog },
    ];
    // モノリス落下
    const wideDamageLogs = wideDamage(islandUuid, monumentX, monumentY, turn);
    monumentAttackLogs.push(...wideDamageLogs);

    return monumentAttackLogs;
  }
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
