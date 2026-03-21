/**
 * @module turn
 * @description ターン処理のメインロジック。各島の計画実行・収入計算・イベント処理を行う。
 */
import type {
  Database,
  Island,
  Plan,
  TurnLog,
  islandInfo,
  islandInfoTurnProgress,
} from '@/db/kysely';
import { db } from '@/db/kysely';
import {
  disasterAchievements,
  getAchievement,
  monsterKillAchievements,
  monumentAchievements,
  prosperityAchievements,
} from '@/global/define/achievementType';
import {
  logDisaster,
  logMonsterKillAward,
  logMonumentAward,
  logProsperity,
  logTurnCup,
  logTurnResult,
} from '@/global/define/logType';
import { getMapDefine, mapType } from '@/global/define/mapType';
import META_DATA from '@/global/define/metadata';
import { financing } from '@/global/define/planCategory/planManege';
import { getPlanDefine } from '@/global/define/planType';
import { createUuid25 } from '@/global/function/encrypt';
import { IslandStats, accumulateCellStats, createIslandStats } from '@/global/function/island';
import { turnProceedLogger } from '@/global/function/logger';
import {
  batchInsertDeletePlans,
  earthquakeExecute,
  eruptionExecute,
  getAllIslands,
  getTurnInfo,
  hugeMeteoriteExecute,
  insertLogs,
  lackFoodsExecute,
  landSubsidenceExecute,
  meteoriteExecute,
  monumentAttackExecute,
  popMonsterExecute,
  saveMissileStats,
  savePlanStats,
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
import { Kysely, Transaction, sql } from 'kysely';

/** 再実行上限数 */
const MAX_RECURSIVE = 3;

type MissileBreakdown = Record<string, number>;

type MissileTurnStat = {
  monsterKill: number;
  cityKill: number;
  destroyedMaps: MissileBreakdown;
  killedMonsters: MissileBreakdown;
};

type ThresholdAchievement = {
  type: string;
  threshold: number;
};

type AwardLogBuilder = (prizeName: string) => string;

/** ミサイル内訳を統合する */
const mergeBreakdowns = (target: MissileBreakdown, source: MissileBreakdown) => {
  for (const [type, count] of Object.entries(source)) {
    target[type] = (target[type] ?? 0) + count;
  }
};

// -----------------------------------------------------------------------------
// Achievement Awards
// -----------------------------------------------------------------------------

const awardByThreshold = (
  island: islandInfoTurnProgress,
  metric: number,
  achievements: ThresholdAchievement[],
  prizeSet: Set<string>,
  newPrizes: Array<{ uuid: string; prize: string }>,
  nextTurn: number,
  logArray: TurnLog[],
  createLog: AwardLogBuilder
) => {
  for (const { type, threshold } of achievements) {
    if (metric < threshold) continue;

    const key = `${island.uuid}:${type}`;
    if (prizeSet.has(key)) continue;

    prizeSet.add(key);
    newPrizes.push({ uuid: island.uuid, prize: type });
    const prizeName = getAchievement(type)?.name ?? type;
    const logMessage = createLog(prizeName);
    logArray.push({
      log_uuid: createUuid25(),
      from_uuid: island.uuid,
      to_uuid: island.uuid,
      turn: nextTurn,
      log: logMessage,
      secret_log: logMessage,
    });
  }
};

/**
 * 繁栄賞・災難賞・怪獣討伐賞・記念碑賞の付与
 * @param db DB接続情報
 * @param finalData 最終島情報一覧
 * @param prevPopulations ターン前の人口マップ (uuid -> population)
 * @param nextTurn 次のターン数
 * @param logArray ログ配列
 */
async function awardIslandAchievements(
  db: Kysely<Database>,
  finalData: islandInfoTurnProgress[],
  prevPopulations: Map<string, number>,
  nextTurn: number,
  logArray: TurnLog[]
) {
  const aliveIslands = finalData.filter((island) => island.population > 0);
  if (aliveIslands.length === 0) return;

  const uuids = aliveIslands.map((island) => island.uuid);

  const [existingPrizeRows, monsterKillRows, monumentRows] = await Promise.all([
    db.selectFrom('prize').select(['uuid', 'prize']).where('uuid', 'in', uuids).execute(),
    db
      .selectFrom('missile_stats')
      .select(['uuid', 'monster_kill'])
      .where('uuid', 'in', uuids)
      .execute(),
    db
      .selectFrom('plan_stats')
      .select(['uuid', 'count'])
      .where('uuid', 'in', uuids)
      .where('plan', '=', 'monument_dev')
      .execute(),
  ]);

  const prizeSet = new Set(existingPrizeRows.map((p) => `${p.uuid}:${p.prize}`));
  const newPrizes: Array<{ uuid: string; prize: string }> = [];

  // 累計怪獣討伐数（missile_stats.monster_kill）を島ごとに取得
  const monsterKillMap = new Map(monsterKillRows.map((row) => [row.uuid, row.monster_kill]));

  // 累計記念碑建設数（plan_stats の monument_dev）を島ごとに取得
  const monumentMap = new Map(monumentRows.map((row) => [row.uuid, row.count]));

  for (const island of aliveIslands) {
    awardByThreshold(
      island,
      island.population,
      prosperityAchievements,
      prizeSet,
      newPrizes,
      nextTurn,
      logArray,
      (prizeName) => logProsperity(island, prizeName)
    );

    // 災難賞チェック（今ターンの死亡者数 = ターン前人口 - 現在人口）
    const prevPop = prevPopulations.get(island.uuid) ?? island.population;
    const deaths = Math.max(0, prevPop - island.population);
    awardByThreshold(
      island,
      deaths,
      disasterAchievements,
      prizeSet,
      newPrizes,
      nextTurn,
      logArray,
      (prizeName) => logDisaster(island, prizeName, deaths)
    );

    // 怪獣討伐賞チェック（累計怪獣討伐数）
    const monsterKills = monsterKillMap.get(island.uuid) ?? 0;
    awardByThreshold(
      island,
      monsterKills,
      monsterKillAchievements,
      prizeSet,
      newPrizes,
      nextTurn,
      logArray,
      (prizeName) => logMonsterKillAward(island, prizeName, monsterKills)
    );

    // 記念碑賞チェック（累計記念碑建設数）
    const monumentCount = monumentMap.get(island.uuid) ?? 0;
    awardByThreshold(
      island,
      monumentCount,
      monumentAchievements,
      prizeSet,
      newPrizes,
      nextTurn,
      logArray,
      (prizeName) => logMonumentAward(island, prizeName, monumentCount)
    );
  }

  if (newPrizes.length > 0) {
    await db.insertInto('prize').values(newPrizes).execute();
  }
}

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

type DeferredPlanWrite = {
  uuid: string;
  plans: Plan[];
  deleteLength: number;
};

/**
 * 計画実行フェーズ
 * @returns 成功した計画の planType -> 実行数 のマップと遅延書き込みデータ
 */
function planPhase(
  currentTurn: number,
  fromUuid: string,
  plans: Plan[],
  logArray: TurnLog[]
): {
  successCounts: Map<string, number>;
  monsterKills: number;
  cityKills: number;
  destroyedMaps: MissileBreakdown;
  killedMonsters: MissileBreakdown;
  deferredPlan: DeferredPlanWrite | null;
} {
  const nextTurn = currentTurn + 1;
  const dropPlans = new Set<Plan>();
  let financingFlag = plans.length === 0;
  const successCounts = new Map<string, number>();
  let monsterKills = 0;
  let cityKills = 0;
  const destroyedMaps: MissileBreakdown = {};
  const killedMonsters: MissileBreakdown = {};

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

    if (result.success !== false) {
      successCounts.set(plan, (successCounts.get(plan) ?? 0) + 1);
    }

    monsterKills += result.missileMonsterKills ?? 0;
    cityKills += result.missileCityKills ?? 0;
    mergeBreakdowns(destroyedMaps, result.missileDestroyedMaps ?? {});
    mergeBreakdowns(killedMonsters, result.missileKilledMonsters ?? {});

    logArray.push(...result.log);
    if (plans[i].times < 1) dropPlans.add(plans[i]);
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

  let deferredPlan: DeferredPlanWrite | null = null;
  if (plans.length > 0) {
    const insertPlans = plans.filter((plan) => !dropPlans.has(plan));
    const dropLength = financingFlag ? dropPlans.size + 1 : dropPlans.size;
    deferredPlan = { uuid: fromUuid, plans: insertPlans, deleteLength: dropLength };
  }

  return { successCounts, monsterKills, cityKills, destroyedMaps, killedMonsters, deferredPlan };
}

/**
 * 単一セルのターン処理。人口変動・モンスター移動・資源生産などを処理する。
 */
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

/**
 * アクティブな計画を島ごとに取得する。
 * @param db - DBインスタンス
 * @param uuids - 対象島UUID配列
 * @returns 島UUIDごとの計画配列
 */
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

/**
 * ミサイル統計を累積する。
 */
function accumulateMissileStats(
  missileStats: Map<string, MissileTurnStat>,
  uuid: string,
  monsterKills: number,
  cityKills: number,
  destroyedMaps: MissileBreakdown,
  killedMonsters: MissileBreakdown
) {
  if (
    monsterKills === 0 &&
    cityKills === 0 &&
    Object.keys(destroyedMaps).length === 0 &&
    Object.keys(killedMonsters).length === 0
  ) {
    return;
  }
  const prev = missileStats.get(uuid) ?? {
    monsterKill: 0,
    cityKill: 0,
    destroyedMaps: {},
    killedMonsters: {},
  };
  const next: MissileTurnStat = {
    monsterKill: prev.monsterKill + monsterKills,
    cityKill: prev.cityKill + cityKills,
    destroyedMaps: { ...prev.destroyedMaps },
    killedMonsters: { ...prev.killedMonsters },
  };
  mergeBreakdowns(next.destroyedMaps, destroyedMaps);
  mergeBreakdowns(next.killedMonsters, killedMonsters);
  missileStats.set(uuid, next);
}

/**
 * 全島のターン処理を実行する。収入・計画・イベント・統計を処理する。
 */
async function processTurnForIslands(
  db: Kysely<Database> | Transaction<Database>,
  islandList: Island[],
  turnInfo: { turn: number },
  logArray: TurnLog[]
): Promise<{
  prevPopulations: Map<string, number>;
  planStats: Map<string, Map<string, number>>;
  missileStats: Map<string, MissileTurnStat>;
}> {
  const allPlans = await fetchActivePlans(
    db,
    islandList.map((i) => i.uuid)
  );
  const randomIndices = arrayRandomInt(islandList.length);

  // ターン開始前の値を保持するマップ
  const prevStats = new Map<string, { money: number; food: number; population: number }>();
  // 成功した計画の統計（uuid -> planType -> 実行数）
  const planStats = new Map<string, Map<string, number>>();
  // ミサイル統計（uuid -> {monsterKill, cityKill}）
  const missileStats = new Map<string, MissileTurnStat>();
  // 遅延計画書き込みデータ
  const deferredPlanWrites: DeferredPlanWrite[] = [];

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
    const { successCounts, monsterKills, cityKills, destroyedMaps, killedMonsters, deferredPlan } =
      planPhase(turnInfo.turn, uuid, allPlans[uuid] || [], logArray);
    if (deferredPlan) {
      deferredPlanWrites.push(deferredPlan);
    }
    if (successCounts.size > 0) {
      planStats.set(uuid, successCounts);
    }
    accumulateMissileStats(
      missileStats,
      uuid,
      monsterKills,
      cityKills,
      destroyedMaps,
      killedMonsters
    );
    processMapScan(turnInfo.turn, uuid, logArray);
    wideIslandEventPhase(turnInfo.turn, uuid, logArray);
  }

  // 計画の一括書き込み（メインループ外で1トランザクション）
  await batchInsertDeletePlans(db, deferredPlanWrites);

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

  // ターン前の人口マップを返す（称号判定に使用）
  const prevPopulations = new Map<string, number>();
  prevStats.forEach((prev, uuid) => prevPopulations.set(uuid, prev.population));
  return { prevPopulations, planStats, missileStats };
}

/**
 * ターンごとの資源推移履歴を保存する。
 */
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

  // 古い履歴の一括クリーンアップ。
  // uuidごとの100件目のturnをウィンドウ関数で一度に求めてから削除する。
  const uuidParams = uuids.map((uuid) => sql`${uuid}`);
  const cutoffRows = await sql<{ uuid: string; cutoff_turn: number }>`
    SELECT ranked.uuid, ranked.turn AS cutoff_turn
    FROM (
      SELECT uuid, turn, ROW_NUMBER() OVER (PARTITION BY uuid ORDER BY turn DESC) AS rn
      FROM turn_resource_history
      WHERE uuid IN (${sql.join(uuidParams)})
    ) AS ranked
    WHERE ranked.rn = 100
  `.execute(db);

  if (cutoffRows.rows.length === 0) return;

  await db.transaction().execute(async (trx) => {
    for (const row of cutoffRows.rows) {
      await trx
        .deleteFrom('turn_resource_history')
        .where('uuid', '=', row.uuid)
        .where('turn', '<', row.cutoff_turn)
        .execute();
    }
  });
}

/**
 * ターン処理のメインエントリポイント。全島のターンを進行し結果をDBに保存する。
 * @param recursiveCount - 再帰実行回数
 */
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

    const { prevPopulations, planStats, missileStats } = await processTurnForIslands(
      db,
      islandList,
      turnInfo,
      logArray
    );

    islandList = undefined;
    const finalData = islandDataStore.getState().data;
    if (!finalData) throw new Error('島データの取得に失敗しました。');

    // 称号付与(updateIslands より前に実行して island.prize を反映)
    await awardIslandAchievements(db, finalData, prevPopulations, turnInfo.turn + 1, logArray);
    await awardTurnCup(db, finalData, turnInfo.turn + 1, logArray);

    await updateIslands(db, finalData);
    await updateUserInhabited(db, finalData, logArray, turnInfo.turn);

    // 独立した書き込みを並列実行
    await Promise.all([
      saveTurnResourceHistory(db, finalData, turnInfo.turn + 1),
      savePlanStats(db, planStats),
      saveMissileStats(db, missileStats),
      insertLogs(db, logArray),
    ]);

    await updateTurn(db, turnInfo.turn + 1);
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
