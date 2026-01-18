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
  getAllIslands,
  getTurnInfo,
  getUserPlanInfo,
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
} from '@/global/function/turnProgress';
import { arrayRandomInt, memoryUsage } from '@/global/function/utility';
import { buildIndexMap, islandDataGetSet, islandDataStore } from '@/global/store/turnProgress';
import sqlite from 'better-sqlite3';
import { islandSchemaType } from './schema/islandTable';
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
 * @param fromUuid 島のUuid
 */
function incomeAndEatenPhase(fromUuid: string) {
  using fromIslandGetSet = islandDataGetSet(fromUuid);
  const fromIsland = fromIslandGetSet.islandData;
  if (!fromIsland) throw new Error(`島情報が見つかりません。uuid=${fromUuid}`);

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
 * 指定された島（fromUuid）に対して、ユーザーが設定した計画（プラン）を順に実行し、
 * その結果をログ配列（logArray）に追加します。すべての計画が終了した場合や
 * 計画が存在しない場合は、資金繰り（financing）を自動で実行します。
 *
 * @param db         データベース接続オブジェクト
 * @param currentTurn 現在のターン数
 * @param fromUuid  計画を実行する対象の島
 * @param eventRate   イベント発生率データ
 * @param logArray    実行結果のログ配列（参照渡しで結果が追加される）
 */
function planPhase(
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  currentTurn: number,
  fromUuid: string,
  logArray: turnLogSchemaType[]
) {
  const nextTurn = currentTurn + 1;
  const plans = getUserPlanInfo(db, fromUuid);
  const dropPlans: planSchemaType[] = [];
  let financingFlag = plans.length === 0;
  for (let i = 0; i < plans.length; i++) {
    // 計画ナンバーとインデックスが一致しない場合はスキップ
    if (i !== plans[i].plan_no) {
      financingFlag = true;
      break;
    }

    const toUuid = plans[i].to_uuid;
    const planType = getPlanDefine(plans[i].plan);
    // 計画の実行
    const result = planType.changeData({
      plan: plans[i],
      turn: nextTurn,
      uuid: { toIsland: toUuid, fromIsland: fromUuid },
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
      uuid: { toIsland: fromUuid, fromIsland: fromUuid },
    });
    // ログの格納
    logArray.push(...result.log);
  }
  const insertPlans = plans.filter((plan) => !dropPlans.includes(plan));
  // 計画の更新
  if (plans.length > 0) {
    const dropLength = financingFlag ? dropPlans.length + 1 : dropPlans.length;
    insertDeletePlan(db, insertPlans, dropLength, fromUuid);
  }
}

function mapEventPhase(
  currentTurn: number,
  fromIsland: islandSchemaType,
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
            fromUuid: fromIsland.uuid,
          })
        : undefined;
    if (log !== undefined) logArray.push(...log);
  }
}

function wideIslandEventPhase(
  currentTurn: number,
  fromUuid: string,
  logArray: turnLogSchemaType[]
) {
  const nextTurn = currentTurn + 1;
  // 地震
  const earthquakeLog = earthquakeExecute(fromUuid, nextTurn);
  if (earthquakeLog !== undefined) logArray.push(...earthquakeLog);
  // 食糧不足
  const lackFoodsLog = lackFoodsExecute(fromUuid, nextTurn);
  if (lackFoodsLog !== undefined) logArray.push(...lackFoodsLog);
  // 津波
  const tsunamiLog = tsunamiExecute(fromUuid, nextTurn);
  if (tsunamiLog !== undefined) logArray.push(...tsunamiLog);
  // モンスター出現
  const popMonsterLog = popMonsterExecute(fromUuid, nextTurn);
  if (popMonsterLog !== undefined) logArray.push(...popMonsterLog);
  // 地盤沈下
  const landSubsidenceLog = landSubsidenceExecute(fromUuid, nextTurn);
  if (landSubsidenceLog !== undefined) logArray.push(...landSubsidenceLog);
  // 台風発生
  const typhoonLog = typhoonExecute(fromUuid, nextTurn);
  if (typhoonLog !== undefined) logArray.push(...typhoonLog);
  // 巨大隕石落下
  const hugeMeteoriteLog = hugeMeteoriteExecute(fromUuid, nextTurn);
  if (hugeMeteoriteLog !== undefined) logArray.push(...hugeMeteoriteLog);
  // モノリス落下
  const monumentAttackLog = monumentAttackExecute(fromUuid, nextTurn);
  if (monumentAttackLog !== undefined) logArray.push(...monumentAttackLog);
  // 隕石落下
  const meteoriteLog = meteoriteExecute(fromUuid, nextTurn);
  if (meteoriteLog !== undefined) logArray.push(...meteoriteLog);
  // 火山噴火
  const eruptionLog = eruptionExecute(fromUuid, nextTurn);
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
    let islandList = getAllIslands(db);
    if (islandList === undefined || islandList.length === 0) return;
    // ランダムに処理する
    const randomArray = arrayRandomInt(islandList.length);
    const logArray: Array<turnLogSchemaType> = [];
    // 進行状況用ストアにデータをセット
    islandDataStore.setState({ data: islandList, indexMap: buildIndexMap(islandList) });

    for (let i = 0; i < randomArray.length; i++) {
      const island = islandList[randomArray[i]];
      // 収入/食料消費フェーズ
      incomeAndEatenPhase(island.uuid);
      // 計画実行フェーズ
      planPhase(db, turnInfo.turn, island.uuid, logArray);
      // マップイベントフェーズ
      mapEventPhase(turnInfo.turn, island, logArray);
      // 島全体イベントフェーズ
      wideIslandEventPhase(turnInfo.turn, island.uuid, logArray);
      // 計算フェーズ
      calcPhase(island);
    }
    // 進行状況用のデータをクリア
    islandList = undefined;

    const islandData = islandDataStore.getState().data;
    if (islandData === undefined) {
      turnProceedLogger.error('島データの取得に失敗しました。');
      return;
    }
    updateIslands(db, islandData);
    updateTurn(db, turnInfo.turn + 1);
    insertLogs(db, logArray);
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      turnProceedLogger.error(`${error.stack}`);
    } else {
      turnProceedLogger.error(`${error}`);
    }
  } finally {
    updateTurnProgressing(db, false);
    db[Symbol.dispose]();
    islandDataStore.getState().reset();
  }
}
// メイン処理
const startUsage = memoryUsage();
const startTime = performance.now(); // 開始時間
turnProceed();
const endTime = performance.now(); // 終了時間
turnProceedLogger.info(`ExecuteTime: ${endTime - startTime} msec`); // 何ミリ秒かかったかを表示する
const endUsage = memoryUsage();
turnProceedLogger.info(`Memory Usage: ${startUsage.messages} -> ${endUsage.messages}`); // メモリ使用量を表示
turnProceedLogger.info(
  `Heap Total Diff: ${Math.round(((endUsage.values['heapTotal'] - startUsage.values['heapTotal']) / 1024 / 1024) * 100) / 100} MB`
);
turnProceedLogger.info(
  `Heap Used Diff: ${(Math.round((endUsage.values['heapUsed'] - startUsage.values['heapUsed']) / 1024 / 1024) * 100) / 100} MB`
);
turnProceedLogger.info(
  `External Diff: ${(Math.round((endUsage.values['external'] - startUsage.values['external']) / 1024 / 1024) * 100) / 100} MB`
);
turnProceedLogger.info(
  `Array Buffers Diff: ${(Math.round((endUsage.values['arrayBuffers'] - startUsage.values['arrayBuffers']) / 1024 / 1024) * 100) / 100} MB`
);
