import { getBaseLog } from '@/global/function/turnProgress';
import { islandDataGetSet } from '@/global/store/turnProgress';
import { logCommonAid, logNoCoordinateCommonDev } from '../logType';
import { changeDataArgs, planType, validCostAndLandType } from '../planType';

export const foodAid: planType = {
  planNo: 900,
  type: 'foodAid',
  coordinate: false,
  category: '運営',
  name: '食料援助',
  otherIsland: true,
  immediate: true,
  mapType: 'none',
  cost: 10000,
  costType: 'food',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using fromIslandGetSet = islandDataGetSet(uuid.fromIsland);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.fromIsland}`);
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    const validConstAndLand = validCostAndLandType(fromIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    const baseLog = getBaseLog(turn, fromIsland, toIsland);
    const cost = this.cost * plan.times;
    toIsland.food += cost;
    fromIsland.food -= cost;
    const log = logCommonAid(fromIsland, toIsland, this);
    // 計画回数の初期化
    plan.times = 0;
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};

export const financialAid: planType = {
  planNo: 901,
  type: 'financialAid',
  coordinate: false,
  category: '運営',
  name: '資金援助',
  otherIsland: true,
  immediate: true,
  mapType: 'none',
  cost: 100,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using fromIslandGetSet = islandDataGetSet(uuid.fromIsland);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.fromIsland}`);
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    const validConstAndLand = validCostAndLandType(fromIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    const baseLog = getBaseLog(turn, fromIsland, toIsland);
    const cost = this.cost * plan.times;
    toIsland.money += cost;
    fromIsland.money -= cost;
    const log = logCommonAid(fromIsland, toIsland, this);
    // 計画回数の初期化
    plan.times = 0;
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};

export const financing: planType = {
  planNo: 999,
  type: 'financing',
  coordinate: false,
  category: '運営',
  name: '資金繰り',
  otherIsland: false,
  immediate: false,
  mapType: 'none',
  cost: -100,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    const baseLog = getBaseLog(turn, toIsland);
    toIsland.money -= this.cost;
    const log = logNoCoordinateCommonDev(toIsland, this);
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
