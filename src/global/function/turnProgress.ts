import { eventRateSchemaType } from '@/db/schema/eventRateTable';
import {
  islandData,
  islandInfo,
  islandInfoTurnProgress,
  islandSchemaType,
  parseJsonIslandDataTurnProgress,
} from '@/db/schema/islandTable';
import { planSchemaType } from '@/db/schema/planTable';
import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { turnStateSchemaType } from '@/db/schema/turnStateTable';
import sqlite from 'better-sqlite3';
import { difference } from 'es-toolkit';
import {
  logEarthquake,
  logEarthquakeDamage,
  logEruption,
  logEruptionDamageToSea,
  logEruptionDamageToShallows,
  logFallMonument,
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
} from '../define/logType';
import * as mapMonster from '../define/mapCategory/mapMonster';
import { people } from '../define/mapCategory/mapOther';
import { getMapDefine, mapType } from '../define/mapType';
import META_DATA from '../define/metadata';
import { createUuid25 } from './encrypt';
import {
  changeMapData,
  countBaseLandAround,
  getMapAround,
  isOpenSea,
  mapArrayConverter,
  wideDamage,
} from './island';
import {
  arrayRandomInt,
  checkProbability,
  parseDbData,
  randomIntInRange,
  valueOrSafeLimit,
} from './utility';

/**
 * 放棄されていない島情報
 * @param db DB接続情報
 * @param inhabited 居住中かどうか
 * @returns 全ユーザー情報
 */
export function getInhabitedIslands(
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  inhabited: boolean
) {
  const inhabitedNum = inhabited ? 1 : 0;
  const islands = db.client
    .prepare(
      `SELECT 
        island.uuid, user.island_name,
        json(island.prize) as prize,
        island.money, island.food,
        island.area, island.population,
        island.farm, island.factory, island.mining,
        json(island.island_info) as island_info
      FROM
        user INNER JOIN island 
      ON
        user.uuid = island.uuid
      WHERE
        inhabited=${inhabitedNum}`
    )
    .all() as Array<islandInfoTurnProgress>;
  islands.forEach((island) => parseJsonIslandDataTurnProgress(island, false));
  return islands;
}

/**
 * ユーザーの計画情報を取得
 * @param db DB接続情報
 * @param uuid ユーザーUUID
 * @returns 全ユーザー情報
 */
export function getUserPlanInfo(
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  uuid: string
) {
  const plans = db.client
    .prepare(`SELECT * FROM plan WHERE from_uuid=? ORDER BY plan_no ASC`)
    .all(uuid) as planSchemaType[];
  return plans;
}

/**
 * ターン情報を取得
 * @param db DB接続情報
 * @returns 全ユーザー情報
 */
export function getTurnInfo(db: { client: sqlite.Database; [Symbol.dispose]: () => void }) {
  return db.client.prepare(`SELECT * FROM turn_state`).get() as turnStateSchemaType;
}

/**
 * ターン実行情報の更新
 * @param db DB接続情報
 * @param turnProgress ターン処理中かどうか
 * @returns 全ユーザー情報
 */
export function updateTurnProgressing(
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  turnProgress: boolean
) {
  db.client.prepare(`UPDATE turn_state SET turn_processing = ?`).run(parseDbData(turnProgress));
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
export const getEventRate = (
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  uuid: string
) =>
  db.client
    .prepare<string, eventRateSchemaType>(
      `SELECT
        *
      FROM
        event_rate
      WHERE uuid=?`
    )
    .get(uuid);

/**
 * 島情報の一括更新
 * @param islandData 全島情報
 * @param uuid UUID
 */
export const updateIslands = (
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  islandData: islandData
) => {
  const updateIsland = db.client.prepare(
    `UPDATE island
      SET 
        prize = jsonb(@prize),
        money = @money,
        area = @area,
        population = @population,
        food = @food,
        farm = @farm,
        factory = @factory,
        mining = @mining,
        island_info = jsonb(@island_info)
      WHERE
        uuid = @uuid`
  );
  const updateManyIslands = db.client.transaction((tmpArray: islandData) => {
    for (const tmp of tmpArray) {
      updateIsland.run({
        ...tmp,
        ...{ prize: JSON.stringify(tmp.prize), island_info: JSON.stringify(tmp.island_info) },
      });
    }
  });

  updateManyIslands(islandData);
};

/**
 * 島情報の一括更新
 * @param islandData 全島情報
 * @param logData ログ情報
 */
export const insertLogs = (
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  logData: turnLogSchemaType[]
) => {
  const insert = db.client.prepare(
    'INSERT INTO turn_log (log_uuid, from_uuid, to_uuid, turn, secret_log, log) VALUES (@log_uuid, @from_uuid, @to_uuid, @turn, @secret_log, @log)'
  );

  const insertManyLogs = db.client.transaction((logs) => {
    for (const log of logs) insert.run(log);
  });

  insertManyLogs(logData);
};

/**
 * 計画の挿入と削除
 * @param db DB接続情報
 * @param updatePlan 更新する計画情報
 * @param deleteLength 削除する計画の数
 * @param uuid ユーザーUUID
 */
export const insertDeletePlan = (
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  updatePlan: planSchemaType[],
  deleteLength: number,
  uuid: string
) => {
  const insertPlan = db.client.prepare(
    `INSERT INTO plan
      (from_uuid,to_uuid, plan_no, times, x, y, plan)
    VALUES
      (@from_uuid, @to_uuid, @plan_no, @times, @x, @y, @plan)`
  );
  const insertManyPlan = db.client.transaction((tmpArray: planSchemaType[]) => {
    for (const tmp of tmpArray) {
      insertPlan.run({ ...tmp, plan_no: tmp.plan_no - deleteLength });
    }
  });
  // 計画の削除
  db.client.prepare('DELETE FROM plan WHERE from_uuid=?').run(uuid);
  // 計画の挿入
  insertManyPlan(updatePlan);
};

/**
 * 基本ログ情報の取得
 * @note uuidの重複を防ぐため、ログごとにUUIDを生成すること
 * @param turn ターン数
 * @param fromIsland 送信元島情報
 * @param toIsland 送信先島情報
 * @returns 基本ログ情報
 */
export const getBaseLog = (
  turn: number,
  fromIsland: islandSchemaType,
  toIsland: islandSchemaType = fromIsland
) => {
  const log_uuid = createUuid25();
  return { log_uuid: log_uuid, to_uuid: toIsland.uuid, from_uuid: fromIsland.uuid, turn: turn };
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
 * @param island 島情報
 * @param eventRate イベント発生率
 * @param turn ターン数
 * @returns 地震のログ配列
 */
export const earthquakeExecute = (
  island: islandInfoTurnProgress,
  eventRate: eventRateSchemaType,
  turn: number
) => {
  if (checkProbability(eventRate.earthquake)) {
    const baseLog = getBaseLog(turn, island);
    const earthquakeLog = logEarthquake(island);
    const earthquakeLogs: turnLogSchemaType[] = [
      { ...baseLog, log: earthquakeLog, secret_log: earthquakeLog },
    ];
    for (const islandInfo of island.island_info) {
      if (isEarthquakeDamageMap(islandInfo)) {
        // 都市やハリボテ、防衛施設、工場は地震で破壊される
        if (checkProbability(META_DATA.EARTHQUAKE_DESTROY_RATE)) {
          const log = logEarthquakeDamage(island, islandInfo.x, islandInfo.y);
          earthquakeLogs.push({ ...baseLog, log: log, secret_log: log });
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
 * @param island 島情報
 * @param turn ターン数
 * @returns 食糧不足のログ配列
 */
export const lackFoodsExecute = (island: islandInfoTurnProgress, turn: number) => {
  if (island.food <= 0) {
    const lackFoodsLog = logLackFoods(island);
    const baseLog = () => getBaseLog(turn, island);
    const lackFoodsLogs: turnLogSchemaType[] = [
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
 * @param island 島情報
 * @param eventRate イベント発生率
 * @param turn ターン数
 * @returns 津波のログ配列
 */
export const tsunamiExecute = (
  island: islandInfoTurnProgress,
  eventRate: eventRateSchemaType,
  turn: number
) => {
  if (checkProbability(eventRate.tsunami)) {
    const baseLog = () => getBaseLog(turn, island);
    const tsunamiLog = logTsunami(island);
    const tsunamiLogs: turnLogSchemaType[] = [
      { ...baseLog(), log: tsunamiLog, secret_log: tsunamiLog },
    ];
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
  const islandInfoFindPeople = island.island_info.filter((info) => info.type === 'people');
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
 * @param island 島情報
 * @param eventRate イベント発生率
 * @param turn ターン数
 * @returns 津波のログ配列
 */
export const popMonsterExecute = (
  island: islandInfoTurnProgress,
  eventRate: eventRateSchemaType,
  turn: number
) => {
  if (island.artificialMonster > 0) {
    // 怪獣派遣がされている場合は、メカいのらを出現させる
    return popMonster(island, mapMonster.mekaInora, turn, island.artificialMonster);
  } else if (checkProbability((eventRate.monster * island.area) / 100)) {
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
 * @param island 島情報
 * @param eventRate イベント発生率
 * @param turn ターン数
 * @returns 地盤沈下のログ配列
 */
export const landSubsidenceExecute = (
  island: islandInfoTurnProgress,
  eventRate: eventRateSchemaType,
  turn: number
) => {
  if (island.area > META_DATA.FALL_DOWN_BORDER && checkProbability(eventRate.fall_down)) {
    const baseLog = () => getBaseLog(turn, island);
    const landSubsidenceLog = logLandSubsidence(island);
    const landSubsidenceLogs: turnLogSchemaType[] = [
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
 * モノリス落下のログを作成
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns モノリス落下のログ
 */
export const monumentAttackExecute = (island: islandInfoTurnProgress, turn: number) => {
  for (let i = 0; i < island.fallMonument; i++) {
    const baseLog = getBaseLog(turn, island);
    const monumentX = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const monumentY = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const fallMonumentLog = logFallMonument(island, monumentX, monumentY);
    const monumentAttackLogs: turnLogSchemaType[] = [
      { ...baseLog, log: fallMonumentLog, secret_log: fallMonumentLog },
    ];
    // モノリス落下
    const wideDamageLogs = wideDamage(island, monumentX, monumentY, turn);
    monumentAttackLogs.push(...wideDamageLogs);

    return monumentAttackLogs;
  }
};

/**
 * 隕石のダメージを与える処理
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石のログ
 */
const meteoriteDamage = (island: islandInfoTurnProgress, x: number, y: number) => {
  const islandInfo = island.island_info[mapArrayConverter(x, y)];
  const mapDef = getMapDefine(islandInfo.type);
  switch (mapDef.baseLand) {
    case 'sea': {
      switch (islandInfo.type) {
        case 'submarine_missile': {
          // 海底ミサイルは海に変更
          changeMapData(island, x, y, 'sea', { type: 'ins', value: 0 });
          return logMeteoriteToSubmarineMissile(island, x, y);
        }
        default: {
          return logMeteoriteToSea(island, x, y);
        }
      }
    }
    case 'mountain': {
      changeMapData(island, x, y, 'ruins', { type: 'ins', value: 0 });
      return logMeteoriteToMountain(island, x, y);
    }
    case 'shallows': {
      // 浅瀬は海に変更
      changeMapData(island, x, y, 'sea', { type: 'ins', value: 0 });
      return logMeteoriteToShallows(island, x, y);
    }
    case 'monster':
    case 'sanjira':
    case 'kujira': {
      changeMapData(island, x, y, 'shallows', { type: 'ins', value: 0 });
      return logMeteoriteToMonster(island, x, y);
    }
    default: {
      // その他の地形は浅瀬に変更
      changeMapData(island, x, y, 'shallows', {
        type: 'ins',
        value: 0,
      });
      return logMeteorite(island, x, y);
    }
  }
};

/**
 * 隕石イベントの実行
 * @param island 島情報
 * @param eventRate イベント発生率
 * @param turn ターン数
 * @returns 隕石のログ
 */
export const meteoriteExecute = (
  island: islandInfoTurnProgress,
  eventRate: eventRateSchemaType,
  turn: number
) => {
  if (checkProbability(eventRate.meteorite)) {
    const baseLog = () => getBaseLog(turn, island);
    const landSubsidenceLogs: turnLogSchemaType[] = [];
    let meteoriteFlag = true;
    while (meteoriteFlag) {
      const meteoriteX = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
      const meteoriteY = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
      const meteoriteLog = meteoriteDamage(island, meteoriteX, meteoriteY);

      landSubsidenceLogs.push({ ...baseLog(), log: meteoriteLog, secret_log: meteoriteLog });
      // 隕石継続判定
      meteoriteFlag = checkProbability(META_DATA.CONTINUOUS_METEORITE_RATE);
    }
    return landSubsidenceLogs;
  }
};

/**
 * 隕石のダメージを与える処理
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石のログ
 */
const eruptionDamage = (island: islandInfoTurnProgress, turn: number, x: number, y: number) => {
  const logs: turnLogSchemaType[] = [];
  const baseLog = () => getBaseLog(turn, island);
  const eruptionLog = logEruption(island, x, y);
  logs.push({ ...baseLog(), secret_log: eruptionLog, log: eruptionLog });
  changeMapData(island, x, y, 'mountain', { type: 'ins', value: 0 });

  // 周囲1HEXのみ
  const aroundHex1 = difference(getMapAround(x, y, 1), [{ x, y }]);
  aroundHex1.forEach(({ x: changeX, y: changeY }) => {
    if (!isOpenSea(changeX, changeY)) {
      const mapInfo = island.island_info[mapArrayConverter(changeX, changeY)];
      const mapDefine = getMapDefine(mapInfo.type);
      switch (mapDefine.baseLand) {
        case 'shallows': {
          const tmpLog = logEruptionDamageToShallows(island, changeX, changeY);
          logs.push({ ...baseLog(), secret_log: tmpLog, log: tmpLog });
          changeMapData(island, x, y, 'wasteland', { type: 'ins', value: 0 });
          break;
        }
        case 'sea': {
          const tmpLog = logEruptionDamageToSea(island, changeX, changeY);
          logs.push({ ...baseLog(), secret_log: tmpLog, log: tmpLog });
          changeMapData(island, x, y, 'shallows', { type: 'ins', value: 0 });
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
            logs.push({ ...baseLog(), secret_log: tmpLog, log: tmpLog });
            changeMapData(island, x, y, 'wasteland', { type: 'ins', value: 0 });
            break;
          }
        }
      }
    }
  });

  return logs;
};

/**
 * 噴火イベントの実行
 * @param island 島情報
 * @param eventRate イベント発生率
 * @param turn ターン数
 * @returns 噴火のログ
 */
export const eruptionExecute = (
  island: islandInfoTurnProgress,
  eventRate: eventRateSchemaType,
  turn: number
) => {
  if (checkProbability(eventRate.eruption)) {
    const eruptionX = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const eruptionY = randomIntInRange(0, META_DATA.MAP_SIZE - 1);
    const eruptionLogs = eruptionDamage(island, turn, eruptionX, eruptionY);
    return eruptionLogs;
  }
};
