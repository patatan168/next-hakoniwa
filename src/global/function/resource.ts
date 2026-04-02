/**
 * @module resource
 * @description 島の資源（資金・食料）を受け取る際の共通計算を提供する。
 */
import META_DATA from '@/global/define/metadata';

export type IslandResource = {
  money: number;
  food: number;
};

const normalizeInteger = (value: number) => {
  return Number.isFinite(value) ? Math.trunc(value) : 0;
};

const normalizeMax = (value: number) => {
  if (!Number.isFinite(value)) return Number.MAX_SAFE_INTEGER;
  const normalized = Math.trunc(value);
  if (normalized < 0) return 0;
  return normalized;
};

const normalizeIncoming = (value: number | undefined) => {
  if (value === undefined) return 0;
  return Math.max(0, normalizeInteger(value));
};

/**
 * ターン処理の基準ロジックで食料・資金を補正する。
 *
 * 1. 食料が上限を超えていれば、超過分を資金へ換算して食料を上限に揃える
 * 2. 資金を 0 以上かつ上限以下に丸める
 */
const normalizeResource = (resource: IslandResource): IslandResource => {
  const maxMoney = normalizeMax(META_DATA.MAX_MONEY);
  const maxFood = normalizeMax(META_DATA.MAX_FOOD);

  let money = normalizeInteger(resource.money);
  let food = normalizeInteger(resource.food);

  if (food > maxFood) {
    const overflowFood = food - maxFood;
    money += Math.ceil(overflowFood * META_DATA.FOOD_TO_MONEY_RATE);
    food = maxFood;
  }

  money = Math.trunc(Math.max(0, Math.min(money, maxMoney)));

  return {
    money,
    food,
  };
};

/**
 * 島の資源を正規化して返す。
 *
 * @param current 現在の資源
 * @param incoming 追加で受け取る資源（省略時は 0 扱い）
 * @returns ターン処理基準ルールを適用した資源
 */
export const getResource = (
  current: IslandResource,
  incoming: Partial<IslandResource> = {}
): IslandResource => {
  const normalizedIncoming = {
    money: normalizeIncoming(incoming.money),
    food: normalizeIncoming(incoming.food),
  };
  const normalizedCurrent = normalizeResource(current);

  return normalizeResource({
    money: normalizedCurrent.money + normalizedIncoming.money,
    food: normalizedCurrent.food + normalizedIncoming.food,
  });
};
