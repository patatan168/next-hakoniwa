import { executeMissile } from '@/global/function/missile';
import { islandDataGetSet } from '@/global/store/turnProgress';
import { changeDataArgs, planType } from '../planType';

export const normaMissile: planType = {
  planNo: 201,
  type: 'normal_missile',
  coordinate: true,
  category: '攻撃',
  name: 'ミサイル発射',
  description: '対象の島に誤差2HEXの範囲でミサイルを発射します。',
  otherIsland: true,
  immediate: false,
  mapType: 'none',
  cost: 20,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 99,
  unit: '回',
  changeData: function ({ turn, uuid, plan }: changeDataArgs) {
    using fromIslandGetSet = islandDataGetSet(uuid.fromIsland);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`発射元の島情報が見つかりません。uuid=${uuid.fromIsland}`);

    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`発射先の島情報が見つかりません。uuid=${uuid.toIsland}`);

    const log = executeMissile({
      turn,
      fromIsland,
      toIsland,
      targetX: plan.x,
      targetY: plan.y,
      missileType: 'normal',
      times: plan.times ?? 1,
      planName: this.name,
      cost: this.cost,
    });
    // 実行回数をリセット
    plan.times = 0;

    return { nextPlan: this.immediate, log };
  },
};

export const ppMissile: planType = {
  planNo: 202,
  type: 'pp_missile',
  coordinate: true,
  category: '攻撃',
  name: 'PPミサイル発射',
  description: '対象の島に誤差1HEXの範囲でPPミサイルを発射します。',
  otherIsland: true,
  immediate: false,
  mapType: 'none',
  cost: 50,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 99,
  unit: '回',
  changeData: function ({ turn, uuid, plan }: changeDataArgs) {
    using fromIslandGetSet = islandDataGetSet(uuid.fromIsland);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`発射元の島情報が見つかりません。uuid=${uuid.fromIsland}`);

    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`発射先の島情報が見つかりません。uuid=${uuid.toIsland}`);

    const log = executeMissile({
      turn,
      fromIsland,
      toIsland,
      targetX: plan.x,
      targetY: plan.y,
      missileType: 'pp',
      times: plan.times ?? 1,
      planName: this.name,
      cost: this.cost,
    });
    plan.times = 0;

    return { nextPlan: this.immediate, log };
  },
};

export const stMissile: planType = {
  planNo: 203,
  type: 'st_missile',
  coordinate: true,
  category: '攻撃',
  name: 'STミサイル発射',
  description:
    '対象の島に誤差1HEXの範囲でステルスミサイルを発射します。相手の島はどの島から発射されたか分かリません。',
  otherIsland: true,
  immediate: false,
  mapType: 'none',
  cost: 1000,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 99,
  unit: '回',
  changeData: function ({ turn, uuid, plan }: changeDataArgs) {
    using fromIslandGetSet = islandDataGetSet(uuid.fromIsland);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`発射元の島情報が見つかりません。uuid=${uuid.fromIsland}`);

    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`発射先の島情報が見つかりません。uuid=${uuid.toIsland}`);

    const log = executeMissile({
      turn,
      fromIsland,
      toIsland,
      targetX: plan.x,
      targetY: plan.y,
      missileType: 'st',
      times: plan.times ?? 1,
      planName: this.name,
      cost: this.cost,
    });
    plan.times = 0;

    return { nextPlan: this.immediate, log };
  },
};

export const ldMissile: planType = {
  planNo: 204,
  type: 'ld_missile',
  coordinate: true,
  category: '攻撃',
  name: '陸地破壊爆弾発射',
  description:
    '対象の島の陸地を海に沈める誤差2HEXの範囲で着弾する爆弾を発射します。海底基地も破壊可能です。',
  otherIsland: true,
  immediate: false,
  mapType: 'none',
  cost: 2000,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 99,
  unit: '回',
  changeData: function ({ turn, uuid, plan }: changeDataArgs) {
    using fromIslandGetSet = islandDataGetSet(uuid.fromIsland);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`発射元の島情報が見つかりません。uuid=${uuid.fromIsland}`);

    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`発射先の島情報が見つかりません。uuid=${uuid.toIsland}`);

    const log = executeMissile({
      turn,
      fromIsland,
      toIsland,
      targetX: plan.x,
      targetY: plan.y,
      missileType: 'ld',
      times: plan.times ?? 1,
      planName: this.name,
      cost: this.cost,
    });
    plan.times = 0;

    return { nextPlan: this.immediate, log };
  },
};
