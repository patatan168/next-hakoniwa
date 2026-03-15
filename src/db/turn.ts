import type {
  Database,
  Island,
  Plan,
  TurnLog,
  islandInfo,
  islandInfoTurnProgress,
} from '@/db/kysely';
import { db } from '@/db/kysely';
import { logTurnCup, logTurnResult } from '@/global/define/logType';
import { getMapDefine, mapType } from '@/global/define/mapType';
import META_DATA from '@/global/define/metadata';
import { financing } from '@/global/define/planCategory/planManege';
import { getPlanDefine } from '@/global/define/planType';
import { createUuid25 } from '@/global/function/encrypt';
import { IslandStats, accumulateCellStats, createIslandStats } from '@/global/function/island';
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
  setAllIslandStats,
  tsunamiExecute,
  typhoonExecute,
  updateIslands,
  updateTurn,
  updateTurnProgressing,
  updateUserInhabited,
} from '@/global/function/turnProgress';
import { arrayRandomInt, memoryUsage } from '@/global/function/utility';
import { buildIndexMap, islandDataGetSet, islandDataStore } from '@/global/store/turnProgress';
import { Kysely, Transaction } from 'kysely';

/** 再実行上限数 */
const MAX_RECURSIVE = 3;

// -----------------------------------------------------------------------------
// Turn Cup Award
// -----------------------------------------------------------------------------

/**
 * ターン杯の付与
 * 100ターンごとに人口が最多の島に「turn_X」称号を付与する
 * @param db DB接続情報
 * @param finalData 最終島情報一覧
 * @param nextTurn 次のターン数
 * @param logArray ログ配列
 */
async function awardTurnCup(
  db: Kysely<Database>,
  finalData: islandInfoTurnProgress[],
  nextTurn: number,
  logArray: TurnLog[]
) {
  if (nextTurn % 100 !== 0) return;

  const prizeType = `turn_${nextTurn}`;

  // 再実行時の重複付与を防ぐ
  const alreadyAwarded = await db
    .selectFrom('prize')
    .select('uuid')
    .where('prize', '=', prizeType)
    .executeTakeFirst();
  if (alreadyAwarded) return;

  // 生存島の中で人口最多の島を選出
  const aliveIslands = finalData.filter((island) => island.population > 0);
  if (aliveIslands.length === 0) return;

  const winner = aliveIslands.reduce((best, island) =>
    island.population > best.population ? island : best
  );

  // island テーブルの prize 列を更新（updateIslands で DB に反映される）
  winner.prize = prizeType;

  // prize テーブルに挿入
  await db.insertInto('prize').values({ uuid: winner.uuid, prize: prizeType }).execute();

  // ログ追加
  const logMessage = logTurnCup(winner, nextTurn);
  logArray.push({
    log_uuid: createUuid25(),
    from_uuid: winner.uuid,
    to_uuid: winner.uuid,
    turn: nextTurn,
    log: logMessage,
    secret_log: logMessage,
  });
}

/** 再実行時の待機時間(ms) */
const WAIT_TIME = 2000;

/** 各島情報 */

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
async function planPhase(
  db: Kysely<Database> | Transaction<Database>,
  currentTurn: number,
  fromUuid: string,
  plans: Plan[],
  logArray: TurnLog[]
) {
  const nextTurn = currentTurn + 1;
  const dropPlans: Plan[] = [];
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
    await insertDeletePlan(db, insertPlans, dropLength, fromUuid);
  }
}

function processSingleCell(
  item: islandInfo,
  nextTurn: number,
  fromUuid: string,
  island: islandInfoTurnProgress,
  typeCache: Map<string, mapType>,
  stats: IslandStats
): TurnLog[] | undefined {
  let mapDef = typeCache.get(item.type);
  if (!mapDef) {
    mapDef = getMapDefine(item.type);
    typeCache.set(item.type, mapDef);
  }

  accumulateCellStats(item, mapDef, stats);

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
function processMapScan(currentTurn: number, fromUuid: string, logArray: TurnLog[]) {
  using fromIslandGetSet = islandDataGetSet(fromUuid);
  const islandInfo = fromIslandGetSet.islandData;
  if (!islandInfo) throw new Error(`島情報が見つかりません。uuid=${fromUuid}`);

  const nextTurn = currentTurn + 1;
  const stats = createIslandStats();
  const typeCache = new Map<string, mapType>();

  for (const item of islandInfo.island_info) {
    const logs = processSingleCell(item, nextTurn, fromUuid, islandInfo, typeCache, stats);
    if (logs) logArray.push(...logs);
  }

  // 統計情報の反映
  islandInfo.area = stats.area;
  islandInfo.factory = Math.trunc(stats.factory);
  islandInfo.mining = Math.trunc(stats.mining);
  islandInfo.farm = Math.trunc(stats.farm);
  islandInfo.population = Math.trunc(stats.population);
  islandInfo.missile = Math.trunc(stats.missile);

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
function wideIslandEventPhase(currentTurn: number, fromUuid: string, logArray: TurnLog[]) {
  const nextTurn = currentTurn + 1;
  const events: ((uuid: string, turn: number) => TurnLog[] | undefined)[] = [
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

async function fetchActivePlans(
  db: Kysely<Database> | Transaction<Database>,
  uuids: string[]
): Promise<Record<string, Plan[]>> {
  if (uuids.length === 0) return {};
  const CHUNK_SIZE = 900;
  const planMap: Record<string, Plan[]> = {};

  for (let i = 0; i < uuids.length; i += CHUNK_SIZE) {
    const chunk = uuids.slice(i, i + CHUNK_SIZE);
    const rows = await db
      .selectFrom('plan')
      .selectAll()
      .where('from_uuid', 'in', chunk)
      .orderBy('from_uuid', 'asc')
      .orderBy('plan_no', 'asc')
      .execute();

    for (const row of rows) {
      if (!planMap[row.from_uuid]) planMap[row.from_uuid] = [];
      planMap[row.from_uuid].push(row);
    }
  }
  return planMap;
}

async function processTurnForIslands(
  db: Kysely<Database> | Transaction<Database>,
  islandList: Island[],
  turnInfo: { turn: number },
  logArray: TurnLog[]
) {
  const allPlans = await fetchActivePlans(
    db,
    islandList.map((i) => i.uuid)
  );
  const randomIndices = arrayRandomInt(islandList.length);

  // ターン開始前の値を保持するマップ
  const prevStats = new Map<string, { money: number; food: number; population: number }>();

  // フェーズ1: 実際のターン処理を全島に対して実行
  for (const index of randomIndices) {
    const island = islandList[index];
    const uuid = island.uuid;

    // 変動量を計算するために元の値を保持
    prevStats.set(uuid, {
      money: island.money,
      food: island.food,
      population: island.population,
    });

    incomeAndEatenPhase(uuid);
    await planPhase(db, turnInfo.turn, uuid, allPlans[uuid] || [], logArray);
    processMapScan(turnInfo.turn, uuid, logArray);
    wideIslandEventPhase(turnInfo.turn, uuid, logArray);
  }

  // フェーズ2: 全島の処理が完了した後、最終的な変動量を計算してログ出力
  for (const island of islandList) {
    const uuid = island.uuid;
    const prev = prevStats.get(uuid);
    if (!prev) continue;

    // 再度統計情報を設定
    // NOTE: 災害等で破壊された施設を再計算するため
    setAllIslandStats(uuid);

    // 最新の島情報を取得して差分計算
    const currentIsland = islandDataStore.getState().islandGet(uuid);
    if (currentIsland) {
      const diffMoney = currentIsland.money - prev.money;
      const diffFood = currentIsland.food - prev.food;
      const diffPopulation = currentIsland.population - prev.population;

      const moneySign = diffMoney >= 0 ? '+' : '';
      const foodSign = diffFood >= 0 ? '+' : '';
      const popSign = diffPopulation >= 0 ? '+' : '';
      const log_uuid = createUuid25();

      const secretLogMessage = logTurnResult(
        moneySign,
        diffMoney,
        foodSign,
        diffFood,
        popSign,
        diffPopulation
      );

      logArray.push({
        log_uuid: log_uuid,
        from_uuid: uuid,
        to_uuid: uuid,
        turn: turnInfo.turn + 1,
        secret_log: secretLogMessage,
        log: null,
      });
    }
  }
}

async function saveTurnResourceHistory(
  db: Kysely<Database> | Transaction<Database>,
  islands: Island[],
  turn: number
) {
  if (islands.length === 0) return;

  const uuids = islands.map((island) => island.uuid);

  // 同一ターン再実行時の重複を避けるため、対象UUID分の当該ターン履歴を先に削除する
  await db
    .deleteFrom('turn_resource_history')
    .where('turn', '=', turn)
    .where('uuid', 'in', uuids)
    .execute();

  await db
    .insertInto('turn_resource_history')
    .values(
      islands.map((island) => ({
        uuid: island.uuid,
        turn,
        population: island.population,
        food: island.food,
        money: island.money,
      }))
    )
    .execute();

  for (const uuid of uuids) {
    // MySQL では IN 句サブクエリ内の LIMIT が制限されるため、
    // 100件目の turn を閾値にして古い履歴を削除する
    const cutoff = await db
      .selectFrom('turn_resource_history')
      .select('turn')
      .where('uuid', '=', uuid)
      .orderBy('turn', 'desc')
      .limit(1)
      .offset(99)
      .executeTakeFirst();

    if (!cutoff) continue;

    await db
      .deleteFrom('turn_resource_history')
      .where('uuid', '=', uuid)
      .where('turn', '<', cutoff.turn)
      .execute();
  }
}

async function turnProceed(recursiveCount = 0) {
  const turnInfo = await getTurnInfo(db);
  if (!turnInfo) return;
  // ターン処理中チェック
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

  await updateTurnProgressing(db, true);

  try {
    let islandList = await getAllIslands(db);
    if (!islandList || islandList.length === 0) return;

    const logArray: TurnLog[] = [];
    islandDataStore.setState({ data: islandList, indexMap: buildIndexMap(islandList) });

    await processTurnForIslands(db, islandList, turnInfo, logArray);

    islandList = undefined;
    const finalData = islandDataStore.getState().data;
    if (!finalData) throw new Error('島データの取得に失敗しました。');

    // 100ターンごとにターン杯を付与（updateIslands より前に実行して prize を反映）
    await awardTurnCup(db, finalData, turnInfo.turn + 1, logArray);

    await updateIslands(db, finalData);
    await updateUserInhabited(db, finalData, logArray, turnInfo.turn);
    await saveTurnResourceHistory(db, finalData, turnInfo.turn + 1);
    await updateTurn(db, turnInfo.turn + 1);
    await insertLogs(db, logArray);
  } catch (error) {
    const msg = error instanceof Error ? error.stack : `${error}`;
    turnProceedLogger.error(msg);
  } finally {
    await updateTurnProgressing(db, false);
    islandDataStore.getState().reset();
  }
}

// -----------------------------------------------------------------------------
// Entry Point
// -----------------------------------------------------------------------------

const startUsage = memoryUsage();
const startTime = performance.now();

(async () => {
  await turnProceed();

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
})();
