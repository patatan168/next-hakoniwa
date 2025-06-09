import { financing } from '@/global/define/planCategory/planManege';
import { getPlanDefine } from '@/global/define/planType';
import { dbConn } from '@/global/function/db';
import {
  getEventRate,
  getInhabitedIslands,
  getIslandData,
  getTurnInfo,
  getUserPlanInfo,
  updateIslands,
  updateTurnProgressing,
} from '@/global/function/turnProgress';
import { arrayRandomInt } from '@/global/function/utility';
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
    const plans = getUserPlanInfo(db, island.uuid);
    const islandData = getIslandData(islandList, island.uuid);
    const eventRate = getEventRate(db, island.uuid);
    // 計画実行フェーズ
    let financingFlag = plans.length === 0;
    for (const [index, plan] of Object.entries(plans)) {
      const toIsland =
        plan.to_uuid === islandData.uuid ? islandData : getIslandData(islandList, plan.from_uuid);
      const planType = getPlanDefine(plan.plan);
      // 計画の実行
      const result = planType.changeData({
        x: plan.x,
        y: plan.y,
        turn: turnInfo.turn,
        info: { times: plan.times, toIsland: toIsland, fromIsland: islandData },
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
        turn: turnInfo.turn,
        info: { times: 1, toIsland: islandData, fromIsland: islandData },
        eventRate: eventRate,
      });
      // ログの格納
      logArray.push(...result.log);
    }
  }
  updateIslands(db, islandList);
  updateTurnProgressing(db, false);
}
const startTime = performance.now(); // 開始時間
turnProceed();
const endTime = performance.now(); // 終了時間
console.log(endTime - startTime); // 何ミリ秒かかったかを表示する
