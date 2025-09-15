import { getMapDefine } from '@/global/define/mapType';
import META_DATA from '@/global/define/metadata';
import { financing } from '@/global/define/planCategory/planManege';
import { getPlanDefine } from '@/global/define/planType';
import { dbConn } from '@/global/function/db';
import { calcAllTypeNum, countArea } from '@/global/function/island';
import { turnProceedLogger } from '@/global/function/logger';
import {
  earthquakeExecute,
  eruptionExecute,
  getEventRate,
  getInhabitedIslands,
  getIslandData,
  getTurnInfo,
  getUserPlanInfo,
  insertDeletePlan,
  insertLogs,
  lackFoodsExecute,
  landSubsidenceExecute,
  meteoriteExecute,
  monumentAttackExecute,
  popMonsterExecute,
  tsunamiExecute,
  updateIslands,
  updateTurnProgressing,
} from '@/global/function/turnProgress';
import { arrayRandomInt, memoryUsage } from '@/global/function/utility';
import sqlite from 'better-sqlite3';
import { eventRateSchemaType } from './schema/eventRateTable';
import { islandInfoTurnProgress, islandSchemaType } from './schema/islandTable';
import { planSchemaType } from './schema/planTable';
import { turnLogSchemaType } from './schema/turnLogTable';

/** 再実行上限数 */
const MAX_RECURSIVE = 3;

/** 再実行時の待機時間(ms)
 * @note WAIT_TIME*実行回数で待つので待機時間が徐々に伸びる
 * @example
 * ```md
 * WAIT_TIME =1000 1回目:2000ms, 2回目4000ms, 3回目8000ms
 * ```
 */
const WAIT_TIME = 2000;

/**
 * 収入/食料消費フェーズ
 * @param fromIsland
 */
function incomeAndEatenPhase(fromIsland: islandSchemaType) {
  if (fromIsland.population > fromIsland.farm) {
    fromIsland.food += fromIsland.farm / 100;
    fromIsland.money += Math.trunc(
      Math.min(fromIsland.population - fromIsland.food, fromIsland.factory + fromIsland.mining) / 10
    );
  } else {
    fromIsland.food += fromIsland.population / 100;
  }
  // 食料消費
  fromIsland.food -= Math.trunc(fromIsland.population * META_DATA.EATEN_FOOD_PER_PEOPLE);
}

/**
 * 各島の計画フェーズを実行する関数。
 *
 * 指定された島（fromIsland）に対して、ユーザーが設定した計画（プラン）を順に実行し、
 * その結果をログ配列（logArray）に追加します。すべての計画が終了した場合や
 * 計画が存在しない場合は、資金繰り（financing）を自動で実行します。
 *
 * @param db         データベース接続オブジェクト
 * @param currentTurn 現在のターン数
 * @param islandList  島データの配列
 * @param fromIsland  計画を実行する対象の島
 * @param eventRate   イベント発生率データ
 * @param logArray    実行結果のログ配列（参照渡しで結果が追加される）
 */
function planPhase(
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  currentTurn: number,
  islandList: islandInfoTurnProgress[],
  fromIsland: islandInfoTurnProgress,
  eventRate: eventRateSchemaType,
  logArray: turnLogSchemaType[]
) {
  const nextTurn = currentTurn + 1;
  const plans = getUserPlanInfo(db, fromIsland.uuid);
  const dropPlans: planSchemaType[] = [];
  let financingFlag = plans.length === 0;
  for (let i = 0; i < plans.length; i++) {
    // 計画ナンバーとインデックスが一致しない場合はスキップ
    if (i !== plans[i].plan_no) {
      financingFlag = true;
      break;
    }

    const toIsland =
      plans[i].to_uuid === fromIsland.uuid
        ? fromIsland
        : getIslandData(islandList, plans[i].from_uuid);
    const planType = getPlanDefine(plans[i].plan);
    // 計画の実行
    const result = planType.changeData({
      plan: plans[i],
      turn: nextTurn,
      info: { toIsland: toIsland, fromIsland: fromIsland },
      eventRate: eventRate,
    });

    // ログの格納
    logArray.push(...result.log);
    // 回数が1未満なら削除リスト入り
    if (plans[i].times < 1) {
      dropPlans.push(plans[i]);
    }
    // 次の計画に行けないので終了
    if (!result.nextPlan) break;
    // NOTE: 高速コマンドで計画が終了する場合、資金繰りをする
    financingFlag = i + 1 === plans.length;
  }
  // 資金繰りの実行
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
      info: {
        toIsland: fromIsland,
        fromIsland: fromIsland,
      },
      eventRate: eventRate,
    });
    // ログの格納
    logArray.push(...result.log);
  }
  const insertPlans = plans.filter((plan) => !dropPlans.includes(plan));
  // 計画の更新
  if (plans.length > 0) {
    const dropLength = financingFlag ? dropPlans.length + 1 : dropPlans.length;
    insertDeletePlan(db, insertPlans, dropLength, fromIsland.uuid);
  }
}

function mapEventPhase(
  currentTurn: number,
  fromIsland: islandSchemaType,
  eventRate: eventRateSchemaType,
  logArray: turnLogSchemaType[]
) {
  const nextTurn = currentTurn + 1;
  for (const islandData of fromIsland.island_info) {
    const mapInfo = getMapDefine(islandData.type);
    const log =
      mapInfo.event !== undefined
        ? mapInfo.event({
            x: islandData.x,
            y: islandData.y,
            turn: nextTurn,
            fromIsland: fromIsland,
            eventRate: eventRate,
          })
        : undefined;
    if (log !== undefined) logArray.push(...log);
  }
}

function wideIslandEventPhase(
  currentTurn: number,
  fromIsland: islandInfoTurnProgress,
  eventRate: eventRateSchemaType,
  logArray: turnLogSchemaType[]
) {
  const nextTurn = currentTurn + 1;
  // 地震
  const earthquakeLog = earthquakeExecute(fromIsland, eventRate, nextTurn);
  if (earthquakeLog !== undefined) logArray.push(...earthquakeLog);
  // 食糧不足
  const lackFoodsLog = lackFoodsExecute(fromIsland, nextTurn);
  if (lackFoodsLog !== undefined) logArray.push(...lackFoodsLog);
  // 津波
  const tsunamiLog = tsunamiExecute(fromIsland, eventRate, nextTurn);
  if (tsunamiLog !== undefined) logArray.push(...tsunamiLog);
  // モンスター出現
  const popMonsterLog = popMonsterExecute(fromIsland, eventRate, nextTurn);
  if (popMonsterLog !== undefined) logArray.push(...popMonsterLog);
  // 地盤沈下
  const landSubsidenceLog = landSubsidenceExecute(fromIsland, eventRate, nextTurn);
  if (landSubsidenceLog !== undefined) logArray.push(...landSubsidenceLog);
  // モノリス落下
  const monumentAttackLog = monumentAttackExecute(fromIsland, nextTurn);
  if (monumentAttackLog !== undefined) logArray.push(...monumentAttackLog);
  // 隕石落下
  const meteoriteLog = meteoriteExecute(fromIsland, eventRate, nextTurn);
  if (meteoriteLog !== undefined) logArray.push(...meteoriteLog);
  // 火山噴火
  const eruptionLog = eruptionExecute(fromIsland, eventRate, nextTurn);
  if (eruptionLog !== undefined) logArray.push(...eruptionLog);
}

function calcPhase(fromIsland: islandSchemaType) {
  fromIsland.area = countArea(fromIsland.island_info);
  fromIsland.factory = calcAllTypeNum(fromIsland.island_info, 'factory');
  fromIsland.mining = calcAllTypeNum(fromIsland.island_info, 'mining');
  fromIsland.farm = calcAllTypeNum(fromIsland.island_info, 'farm');
  fromIsland.population = calcAllTypeNum(fromIsland.island_info, 'people');

  // 食料と資金の処理
  if (fromIsland.food > META_DATA.MAX_FOOD) {
    fromIsland.money += Math.trunc((fromIsland.food - META_DATA.MAX_FOOD) / 1000);
    fromIsland.food = Math.min(fromIsland.money, META_DATA.MAX_FOOD);
  }
  fromIsland.money = Math.min(fromIsland.money, META_DATA.MAX_MONEY);
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
    } else {
      turnProceedLogger.error('再実行上限に達しました。終了します。');
      return;
    }
  } else {
    updateTurnProgressing(db, true);
  }
  try {
    const islandList = getInhabitedIslands(db, true);
    const randomArray = arrayRandomInt(islandList.length);
    const logArray: Array<turnLogSchemaType> = [];

    for (let i = 0; i < randomArray.length; i++) {
      const island = islandList[randomArray[i]];
      const eventRate = getEventRate(db, island.uuid);
      if (eventRate === undefined) {
        turnProceedLogger.error(`イベント発生率の取得に失敗しました。uuid=${island.uuid}`);
        continue;
      }
      // 収入/食料消費フェーズ
      incomeAndEatenPhase(island);
      // 計画実行フェーズ
      planPhase(db, turnInfo.turn, islandList, island, eventRate, logArray);
      // マップイベントフェーズ
      mapEventPhase(turnInfo.turn, island, eventRate, logArray);
      // 島全体イベントフェーズ
      wideIslandEventPhase(turnInfo.turn, island, eventRate, logArray);
      // 計算フェーズ
      calcPhase(island);
    }
    updateIslands(db, islandList);
    insertLogs(db, logArray);
  } catch (error) {
    turnProceedLogger.error(`ターン処理中にエラーが発生しました。${error}`);
  } finally {
    updateTurnProgressing(db, false);
  }
}
// メイン処理
const startUsage = memoryUsage();
const startTime = performance.now(); // 開始時間
turnProceed();
const endTime = performance.now(); // 終了時間
turnProceedLogger.info(`ExecuteTime: ${endTime - startTime} msec`); // 何ミリ秒かかったかを表示する
turnProceedLogger.info(`Memory Usage: ${startUsage} -> ${memoryUsage()}`); // メモリ使用量を表示
