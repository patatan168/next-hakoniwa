/**
 * @file 計画情報の定義
 * @listen
 * @author patatan
 */
import { eventRateSchemaType } from '@/db/schema/eventRateTable';
import { islandInfo, islandSchemaType } from '@/db/schema/islandTable';
import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { mapArrayConverter } from '../function/island';
import { logLackCosts, logLandFail } from './logType';
import { getMapDefine, landType } from './mapType';

/** 計画情報 */
export type planInfo = {
  /** 計画回数 */
  times: number;
  /** 目標島 */
  toIsland: islandSchemaType;
  /** 命令島 */
  fromIsland: islandSchemaType;
};

export type planResult = {
  /** 次の計画を実行するか */
  nextPlan: boolean;
  /** ログ */
  log: Array<turnLogSchemaType>;
};

export type planType = {
  /** タイプ */
  readonly type: string;
  /** カテゴリー */
  readonly category: '開発' | '建設' | '攻撃' | '運営';
  /** 名称 */
  readonly name: string;
  /** 他島へのコマンドか */
  readonly otherIsland: boolean;
  /** 即時コマンドか */
  readonly immediate: boolean;
  /** 適用マップ */
  readonly mapType: Array<string> | 'all' | 'none';
  /** 除外地形 (適用マップから特定の地形を除外) */
  readonly excludeLandType?: Array<landType>;
  /** 費用 (億円) */
  readonly cost: number;
  /** 費用タイプ */
  readonly costType: 'money' | 'food';
  /** 最小回数 */
  readonly minTimes: number;
  /** 最大回数 */
  readonly maxTimes: number;
  /** ターンあたりの最大実行回数 */
  readonly maxTimesPerTurn: number | 'infinity';
  /** 倍率 */
  readonly coefficient?: number;
  /** 単位 */
  readonly unit?: string;
  /** データの変更
   * @param x X座標
   * @param y Y座標
   * @param turn ターン数
   * @param info 島情報
   * @param eventRate イベント発生率(目標島のみ)
   * @returns ログ
   */
  readonly changeData: (
    x: number,
    y: number,
    turn: number,
    info: planInfo,
    eventRate: eventRateSchemaType
  ) => planResult;
};

/**
 * コストが十分かどうか
 * @param island 島情報
 * @param plan 計画情報
 * @returns 資金が十分かどうか
 */
export const hasSufficientCosts = (island: islandSchemaType, plan: planType): boolean => {
  const landCost = plan.costType === 'money' ? island.money : island.food;
  return landCost >= plan.cost;
};

/**
 * 予定地の基本地形が有効かどうか
 * @param mapInfo マップ情報
 * @param plan 計画情報
 * @returns 予定地の基本地形が有効かどうか
 */
export const validBaseLandType = (mapInfo: islandInfo, plan: planType) => {
  if (plan.excludeLandType !== undefined) {
    const { baseLand } = getMapDefine(mapInfo.type);
    return !plan.excludeLandType.includes(baseLand);
  } else {
    return true;
  }
};

/**
 * 予定地が有効かどうか
 * @param island 島情報
 * @param plan 計画情報
 * @param x X座標
 * @param y Y座標
 * @returns 予定地が有効かどうか
 */
export const validLandType = (
  island: islandSchemaType,
  plan: planType,
  x: number,
  y: number
): boolean => {
  switch (plan.mapType) {
    case 'none':
      return false;
    case 'all': {
      // マップ情報の取得
      const mapInfo = island.island_info[mapArrayConverter(x, y)];
      // 除外地形以外はtrue
      return validBaseLandType(mapInfo, plan);
    }
    default: {
      // マップ情報の取得
      const mapInfo = island.island_info[mapArrayConverter(x, y)];
      // 適用マップに含まれるか
      const mapIncludes = plan.mapType.includes(mapInfo.type);
      if (mapIncludes) {
        // 除外地形以外はtrue
        return validBaseLandType(mapInfo, plan);
      } else {
        return false;
      }
    }
  }
};

/**
 * コストと地形が有効かどうか
 * @note 有効でない場合はログを返して次の計画を実行する
 * @param island 島情報
 * @param plan 計画情報
 * @param x X座標
 * @param y Y座標
 * @param turn ターン数
 * @returns コストと地形が有効かどうか
 */
export const validCostAndLandType = (
  island: islandSchemaType,
  plan: planType,
  x: number,
  y: number,
  turn: number
): planResult => {
  const baseLog = { to_uuid: island.uuid, from_uuid: island.uuid, turn: turn };
  // 地形整備が不可能なら中止
  if (!validLandType(island, plan, x, y)) {
    const log = logLandFail(island, plan, x, y);
    return { nextPlan: true, log: [{ ...baseLog, secret_log: log, log: log }] };
  }
  // 資金不足の場合は中止
  if (!hasSufficientCosts(island, plan)) {
    const log = logLackCosts(island, plan);
    return { nextPlan: true, log: [{ ...baseLog, secret_log: log, log: log }] };
  }

  return { nextPlan: false, log: [{ ...baseLog, secret_log: 'dummy', log: 'dummy' }] };
};
