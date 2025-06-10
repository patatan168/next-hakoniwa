import { financing } from '@/global/define/planCategory/planManege';
import { getPlanDefine } from '@/global/define/planType';
import { dbConn } from '@/global/function/db';
import {
  getEventRate,
  getInhabitedIslands,
  getIslandData,
  getTurnInfo,
  getUserPlanInfo,
  insertLogs,
  updateIslands,
  updateTurnProgressing,
} from '@/global/function/turnProgress';
import { arrayRandomInt } from '@/global/function/utility';
import sqlite from 'better-sqlite3';
import { eventRateSchemaType } from './schema/eventRateTable';
import { islandSchemaType } from './schema/islandTable';
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
  islandList: islandSchemaType[],
  fromIsland: islandSchemaType,
  eventRate: eventRateSchemaType,
  logArray: turnLogSchemaType[]
) {
  const nextTurn = currentTurn + 1;
  const plans = getUserPlanInfo(db, fromIsland.uuid);
  let financingFlag = plans.length === 0;
  for (const [index, plan] of Object.entries(plans)) {
    const toIsland =
      plan.to_uuid === fromIsland.uuid ? fromIsland : getIslandData(islandList, plan.from_uuid);
    const planType = getPlanDefine(plan.plan);
    // 計画の実行
    const result = planType.changeData({
      x: plan.x,
      y: plan.y,
      turn: nextTurn,
      info: { times: plan.times, toIsland: toIsland, fromIsland: fromIsland },
      eventRate: eventRate,
    });
    // ログの格納
    logArray.push(...result.log);

    if (!result.nextPlan) break;
    // NOTE: 高速コマンドで計画が終了する場合、資金繰りをする
    financingFlag = Number(index) + 1 === plans.length;
  }
  if (financingFlag) {
    // 資金繰りの実行
    const result = financing.changeData({
      x: 0,
      y: 0,
      turn: nextTurn,
      info: { times: 1, toIsland: fromIsland, fromIsland: fromIsland },
      eventRate: eventRate,
    });
    // ログの格納
    logArray.push(...result.log);
  }
}

function turnProceed(recursiveCount = 0) {
  using db = dbConn('./src/db/data/main.db');
  const turnInfo = getTurnInfo(db);
  if (turnInfo.turn_processing === 1) {
    if (recursiveCount < MAX_RECURSIVE) {
      console.warn(
        `現在のターン処理が完了していません。再実行します。試行数：${recursiveCount + 1}`
      );
      return setTimeout(turnProceed, WAIT_TIME * (recursiveCount + 1), recursiveCount + 1);
    } else {
      console.error('再実行上限に達しました。終了します。');
      return;
    }
  } else {
    updateTurnProgressing(db, true);
  }
  const islandList = getInhabitedIslands(db, true);
  const randomArray = arrayRandomInt(islandList.length);
  const logArray: Array<turnLogSchemaType> = [];

  for (let i = 0; i < randomArray.length; i++) {
    const island = islandList[randomArray[i]];
    const eventRate = getEventRate(db, island.uuid);
    // 計画実行フェーズ
    planPhase(db, turnInfo.turn, islandList, island, eventRate, logArray);
  }
  updateIslands(db, islandList);
  insertLogs(db, logArray);
  updateTurnProgressing(db, false);
}
const startTime = performance.now(); // 開始時間
turnProceed();
const endTime = performance.now(); // 終了時間
console.log(endTime - startTime); // 何ミリ秒かかったかを表示する
