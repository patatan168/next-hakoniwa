/**
 * @file 計画情報の定義
 * @listen
 * @author patatan
 */
import { islandInfo, islandSchemaType } from '@/db/schema/islandTable';
import { planSchemaType } from '@/db/schema/planTable';
import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { userSchemaType } from '@/db/schema/userTable';
import { mapArrayConverter } from '../function/island';
import { getBaseLog } from '../function/turnProgress';
import { logLackCosts, logLandFail } from './logType';
import { getMapDefine, landType } from './mapType';
import META_DATA from './metadata';
import * as planConstruction from './planCategory/planConstruction';
import * as planDevelopment from './planCategory/planDevelopment';
import * as planManage from './planCategory/planManege';

/** 計画情報 */
export type planUuid = {
  /** 目標島 */
  toIsland: string;
  /** 命令島 */
  fromIsland: string;
};

export type planResult = {
  /** 次の計画を実行するか */
  nextPlan: boolean;
  /** ログ */
  log: Array<turnLogSchemaType>;
};

export type changeDataArgs = {
  /** 計画情報 */
  plan: planSchemaType;
  /** ターン数 */
  turn: number;
  /** 計画情報 */
  uuid: planUuid;
};

export type planType = {
  /** Plan NO. (列挙用の順序) */
  readonly planNo: number;
  /** タイプ */
  readonly type: string;
  /** 座標に関係するコマンドか */
  readonly coordinate: boolean;
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
   * @returns ログ
   */
  readonly changeData: ({ plan, turn, uuid }: changeDataArgs) => planResult;
};

/**
 * 全ての計画情報を取得
 * @note 定義ファイルが増えたらObjectを追加すること
 * @returns 全ての計画情報
 */
const getAllPlan = () => {
  return { ...planConstruction, ...planDevelopment, ...planManage };
};

let PLAN_SELECT_CACHE: { value: string; label: string; className: string | undefined }[] | null =
  null;

/**
 * SelectBox用の計画情報を取得
 * @returns SelectBox用の計画情報
 */
export const getPlanSelect = () => {
  if (!PLAN_SELECT_CACHE) {
    PLAN_SELECT_CACHE = Object.entries(getAllPlan())
      .map(([_, value]) => value)
      .sort((a, b) => (a.planNo > b.planNo ? 1 : -1))
      .map((value) => {
        const unit = value.costType === 'money' ? META_DATA.UNIT_MONEY : META_DATA.UNIT_FOOD;
        const preUnit = value.cost > 0 ? '' : '+';
        const cost = value.cost !== 0 ? `${preUnit}${Math.abs(value.cost)}${unit}` : '無料';
        // 即時コマンドの場合は背景色を変える
        const optionClassName = value.immediate ? 'bg-sky-100' : undefined;
        return {
          value: value.type,
          label: `${value.name} (${cost})`,
          className: optionClassName,
        };
      });
  }
  return PLAN_SELECT_CACHE;
};

/**
 * 計画情報を取得
 * @param type 計画タイプ
 * @returns 計画情報
 */
export const getPlanDefine = (type: string): planType => {
  const plan = Object.entries(getAllPlan())
    .map(([_, value]) => ({ ...value }))
    .find((plan) => plan.type === type);

  if (!plan) {
    console.error(`Plan type "${type}" not found.`);
    return planManage.financing;
  }

  return plan;
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
 * @param noneMapType 座標に関係しないコマンドの場合にtrue/falseを返す
 * @returns 予定地が有効かどうか
 */
export const validLandType = (
  island: islandSchemaType,
  plan: planType,
  x: number,
  y: number,
  noneMapType: boolean = false
): boolean => {
  switch (plan.mapType) {
    case 'none': {
      // 座標に関係しないコマンドなので常にtrue
      return noneMapType;
    }
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
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  plan: planType,
  x: number,
  y: number,
  turn: number
): planResult => {
  const baseLog = getBaseLog(turn, island);
  // 地形整備が不可能なら中止
  if (!validLandType(island, plan, x, y, true)) {
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
