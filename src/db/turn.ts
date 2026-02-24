import { getMapDefine, mapType } from '@/global/define/mapType';
import META_DATA from '@/global/define/metadata';
import { financing } from '@/global/define/planCategory/planManege';
import { getPlanDefine } from '@/global/define/planType';
import { dbConn } from '@/global/function/db';
import { turnProceedLogger } from '@/global/function/logger';
import {
  earthquakeExecute,
  eruptionExecute,
  getAllIslands,
  getTurnInfo,
  hugeMeteoriteExecute,
  insertDeletePlan,
  insertLogs,
  lackFoodsExecute,
  landSubsidenceExecute,
  meteoriteExecute,
  monumentAttackExecute,
  popMonsterExecute,
  tsunamiExecute,
  typhoonExecute,
  updateIslands,
  updateTurn,
  updateTurnProgressing,
  updateUserInhabited,
} from '@/global/function/turnProgress';
import { arrayRandomInt, memoryUsage } from '@/global/function/utility';
import { buildIndexMap, islandDataGetSet, islandDataStore } from '@/global/store/turnProgress';
import sqlite from 'better-sqlite3';
import { islandInfo, islandInfoTurnProgress, islandSchemaType } from './schema/islandTable';
import { planSchemaType } from './schema/planTable';
import { turnLogSchemaType } from './schema/turnLogTable';

/** 再実行上限数 */
const MAX_RECURSIVE = 3;

/** 再実行時の待機時間(ms) */
const WAIT_TIME = 2000;

/** 各島情報 */
type IslandStats = {
  areaCount: number;
  factoryCount: number;
  miningCount: number;
  farmCount: number;
  missileCount: number;
  populationCount: number;
};

// -----------------------------------------------------------------------------
// Phases
// -----------------------------------------------------------------------------

/**
 * 収入/食料消費フェーズ
 */
function incomeAndEatenPhase(fromUuid: string) {
  using fromIslandGetSet = islandDataGetSet(fromUuid);
  const fromIsland = fromIslandGetSet.islandData;
  if (!fromIsland) throw new Error(`島情報が見つかりません。uuid=${fromUuid}`);

  if (fromIsland.population > fromIsland.farm) {
    fromIsland.food += fromIsland.farm;
    fromIsland.money += Math.trunc(
      fromIsland.factory * META_DATA.FACTORY_PER_PEOPLE +
        fromIsland.mining * META_DATA.MINING_PER_PEOPLE
    );
  } else {
    fromIsland.food += fromIsland.population;
  }
  // 食料消費
  fromIsland.food -= Math.trunc(fromIsland.population * META_DATA.EATEN_FOOD_PER_PEOPLE);
}

/**
 * 計画実行フェーズ
 */
function planPhase(
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  currentTurn: number,
  fromUuid: string,
  plans: planSchemaType[],
  logArray: turnLogSchemaType[]
) {
  const nextTurn = currentTurn + 1;
  const dropPlans: planSchemaType[] = [];
  let financingFlag = plans.length === 0;

  for (let i = 0; i < plans.length; i++) {
    const { to_uuid: toUuid, plan, plan_no } = plans[i];
    if (i !== plan_no) {
      financingFlag = true;
      break;
    }

    const planType = getPlanDefine(plan);
    const result = planType.changeData({
      plan: plans[i],
      turn: nextTurn,
      uuid: { toIsland: toUuid, fromIsland: fromUuid },
    });

    logArray.push(...result.log);
    if (plans[i].times < 1) dropPlans.push(plans[i]);
    if (!result.nextPlan) break;

    financingFlag = i + 1 === plans.length;
  }

  if (financingFlag) {
    const result = financing.changeData({
      plan: {
        from_uuid: 'dummy',
        to_uuid: 'dummy',
        plan_no: 0,
        times: 0,
        x: 0,
        y: 0,
        plan: 'dummy',
      },
      turn: nextTurn,
      uuid: { toIsland: fromUuid, fromIsland: fromUuid },
    });
    logArray.push(...result.log);
  }

  const insertPlans = plans.filter((plan) => !dropPlans.includes(plan));
  if (plans.length > 0) {
    const dropLength = financingFlag ? dropPlans.length + 1 : dropPlans.length;
    insertDeletePlan(db, insertPlans, dropLength, fromUuid);
  }
}

/**
 * 単一セルの処理（イベント実行と統計計算）
 */
function processSingleCell(
  item: islandInfo,
  nextTurn: number,
  fromUuid: string,
  island: islandInfoTurnProgress,
  typeCache: Map<string, mapType>,
  stats: IslandStats
): turnLogSchemaType[] | undefined {
  let mapDef = typeCache.get(item.type);
  if (!mapDef) {
    mapDef = getMapDefine(item.type);
    typeCache.set(item.type, mapDef);
  }

  // 面積カウント
  if (['plains', 'mountain', 'monster', 'sanjira', 'kujira'].includes(mapDef.baseLand)) {
    stats.areaCount++;
  }

  // 統計加算
  const coefficient = mapDef.coefficient ?? 1;
  const level = mapDef.level ?? [0, 1];
  const levelIndex = Math.max(0, level.findLastIndex((l) => item.landValue >= l) + 1);

  const val = coefficient * item.landValue;
  if (item.type === 'factory') stats.factoryCount += val;
  else if (item.type === 'mining') stats.miningCount += val;
  else if (item.type === 'farm') stats.farmCount += val;
  else if (item.type === 'people') stats.populationCount += val;
  else if (item.type === 'missile') stats.missileCount += coefficient * Math.max(0, levelIndex);
  else if (item.type === 'submarine_missile')
    stats.missileCount += coefficient * Math.max(0, levelIndex);

  // イベント実行
  if (mapDef.event) {
    const logs = mapDef.event({
      x: item.x,
      y: item.y,
      turn: nextTurn,
      fromUuid,
      island,
    });
    return logs || undefined;
  }
}

/**
 * マップイベントおよび計算フェーズ
 */
function processMapScan(currentTurn: number, fromUuid: string, logArray: turnLogSchemaType[]) {
  using fromIslandGetSet = islandDataGetSet(fromUuid);
  const islandInfo = fromIslandGetSet.islandData;
  if (!islandInfo) throw new Error(`島情報が見つかりません。uuid=${fromUuid}`);

  const nextTurn = currentTurn + 1;
  const stats: IslandStats = {
    areaCount: 0,
    factoryCount: 0,
    miningCount: 0,
    farmCount: 0,
    missileCount: 0,
    populationCount: 0,
  };
  const typeCache = new Map<string, mapType>();

  for (const item of islandInfo.island_info) {
    const logs = processSingleCell(item, nextTurn, fromUuid, islandInfo, typeCache, stats);
    if (logs) logArray.push(...logs);
  }

  // 統計情報の反映
  islandInfo.area = 100 * stats.areaCount;
  islandInfo.factory = Math.trunc(stats.factoryCount);
  islandInfo.mining = Math.trunc(stats.miningCount);
  islandInfo.farm = Math.trunc(stats.farmCount);
  islandInfo.population = Math.trunc(stats.populationCount);
  islandInfo.missile = Math.trunc(stats.missileCount);

  // 食料と資金の処理
  if (islandInfo.food > META_DATA.MAX_FOOD) {
    islandInfo.money += Math.ceil(
      (islandInfo.food - META_DATA.MAX_FOOD) * META_DATA.FOOD_TO_MONEY_RATE
    );
    islandInfo.food = Math.min(islandInfo.food, META_DATA.MAX_FOOD);
  }
  islandInfo.money = Math.trunc(Math.max(0, Math.min(islandInfo.money, META_DATA.MAX_MONEY)));
}

/**
 * 島全体イベントフェーズ
 */
function wideIslandEventPhase(
  currentTurn: number,
  fromUuid: string,
  logArray: turnLogSchemaType[]
) {
  const nextTurn = currentTurn + 1;
  const events: ((uuid: string, turn: number) => turnLogSchemaType[] | undefined)[] = [
    earthquakeExecute,
    lackFoodsExecute,
    tsunamiExecute,
    popMonsterExecute,
    landSubsidenceExecute,
    typhoonExecute,
    hugeMeteoriteExecute,
    monumentAttackExecute,
    meteoriteExecute,
    eruptionExecute,
  ];

  for (const event of events) {
    const log = event(fromUuid, nextTurn);
    if (log) logArray.push(...log);
  }
}

// -----------------------------------------------------------------------------
// Turn Controller
// -----------------------------------------------------------------------------

function fetchActivePlans(
  db: { client: sqlite.Database },
  uuids: string[]
): Record<string, planSchemaType[]> {
  if (uuids.length === 0) return {};
  const CHUNK_SIZE = 900;
  const planMap: Record<string, planSchemaType[]> = {};

  for (let i = 0; i < uuids.length; i += CHUNK_SIZE) {
    const chunk = uuids.slice(i, i + CHUNK_SIZE);
    const placeholders = chunk.map(() => '?').join(',');
    const rows = db.client
      .prepare(
        `SELECT * FROM plan WHERE from_uuid IN (${placeholders}) ORDER BY from_uuid, plan_no ASC`
      )
      .all(...chunk) as planSchemaType[];

    for (const row of rows) {
      if (!planMap[row.from_uuid]) planMap[row.from_uuid] = [];
      planMap[row.from_uuid].push(row);
    }
  }
  return planMap;
}

function processTurnForIslands(
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  islandList: islandSchemaType[],
  turnInfo: { turn: number },
  logArray: turnLogSchemaType[]
) {
  const allPlans = fetchActivePlans(
    db,
    islandList.map((i) => i.uuid)
  );
  const randomIndices = arrayRandomInt(islandList.length);

  for (const index of randomIndices) {
    const island = islandList[index];
    const uuid = island.uuid;

    incomeAndEatenPhase(uuid);
    planPhase(db, turnInfo.turn, uuid, allPlans[uuid] || [], logArray);
    processMapScan(turnInfo.turn, uuid, logArray);
    wideIslandEventPhase(turnInfo.turn, uuid, logArray);
  }
}

function turnProceed(recursiveCount = 0) {
  using db = dbConn('./src/db/data/main.db');
  const turnInfo = getTurnInfo(db);

  if (turnInfo.turn_processing === 1) {
    if (recursiveCount < MAX_RECURSIVE) {
      turnProceedLogger.warn(
        `現在のターン処理が完了していません。再実行します。試行数：${recursiveCount + 1}`
      );
      return setTimeout(turnProceed, WAIT_TIME * (recursiveCount + 1), recursiveCount + 1);
    }
    turnProceedLogger.error('再実行上限に達しました。終了します。');
    return;
  }

  updateTurnProgressing(db, true);

  try {
    let islandList = getAllIslands(db);
    if (!islandList || islandList.length === 0) return;

    const logArray: turnLogSchemaType[] = [];
    islandDataStore.setState({ data: islandList, indexMap: buildIndexMap(islandList) });

    processTurnForIslands(db, islandList, turnInfo, logArray);

    islandList = undefined;
    const finalData = islandDataStore.getState().data;
    if (!finalData) throw new Error('島データの取得に失敗しました。');

    updateIslands(db, finalData);
    updateUserInhabited(db, finalData, logArray, turnInfo.turn);
    updateTurn(db, turnInfo.turn + 1);
    insertLogs(db, logArray);
  } catch (error) {
    const msg = error instanceof Error ? error.stack : `${error}`;
    turnProceedLogger.error(msg);
  } finally {
    updateTurnProgressing(db, false);
    islandDataStore.getState().reset();
  }
}

// -----------------------------------------------------------------------------
// Entry Point
// -----------------------------------------------------------------------------

const startUsage = memoryUsage();
const startTime = performance.now();

turnProceed();

const endTime = performance.now();
const endUsage = memoryUsage();

turnProceedLogger.info(`ExecuteTime: ${Math.round((endTime - startTime) * 100) / 100} msec`);
turnProceedLogger.info(`Memory Usage: ${startUsage.messages} -> ${endUsage.messages}`);
const mbDiff = (key: keyof typeof endUsage.values) =>
  Math.round(((endUsage.values[key] - startUsage.values[key]) / 1024 / 1024) * 100) / 100;

turnProceedLogger.info(`Heap Total Diff: ${mbDiff('heapTotal')} MB`);
turnProceedLogger.info(`Heap Used Diff: ${mbDiff('heapUsed')} MB`);
turnProceedLogger.info(`External Diff: ${mbDiff('external')} MB`);
turnProceedLogger.info(`Array Buffers Diff: ${mbDiff('arrayBuffers')} MB`);
