/**
 * @module planAtack
 * @description 攻撃系計画の定義。
 */
import { executeMissile } from '@/global/function/missile';
import { islandDataGetSet } from '@/global/store/turnProgress';
import { getBaseLog, logCommonAid } from '../logType';
import { changeDataArgs, planType, validCostAndLandType } from '../planType';

export const normaMissile: planType = {
  planNo: 201,
  type: 'normal_missile',
  coordinate: true,
  category: '攻撃',
  name: 'ミサイル発射',
  description: '対象の島に誤差2HEXの範囲でミサイルを発射します。計画数を0にすると全弾発射します。',
  otherIsland: true,
  immediate: false,
  mapType: 'none',
  cost: 20,
  costType: 'money',
  minTimes: 0,
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

    const result = executeMissile({
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

    return {
      nextPlan: this.immediate,
      log: result.logs,
      missileMonsterKills: result.monsterKills,
      missileCityKills: result.cityKills,
      missileDestroyedMaps: result.destroyedMaps,
      missileKilledMonsters: result.killedMonsters,
      missileRefugeesAccepted: result.refugeeAccepted,
    };
  },
};

export const ppMissile: planType = {
  planNo: 202,
  type: 'pp_missile',
  coordinate: true,
  category: '攻撃',
  name: 'PPミサイル発射',
  description:
    '対象の島に誤差1HEXの範囲でPPミサイルを発射します。計画数を0にすると全弾発射します。',
  otherIsland: true,
  immediate: false,
  mapType: 'none',
  cost: 50,
  costType: 'money',
  minTimes: 0,
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

    const result = executeMissile({
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

    return {
      nextPlan: this.immediate,
      log: result.logs,
      missileMonsterKills: result.monsterKills,
      missileCityKills: result.cityKills,
      missileDestroyedMaps: result.destroyedMaps,
      missileKilledMonsters: result.killedMonsters,
      missileRefugeesAccepted: result.refugeeAccepted,
    };
  },
};

export const stMissile: planType = {
  planNo: 203,
  type: 'st_missile',
  coordinate: true,
  category: '攻撃',
  name: 'STミサイル発射',
  description:
    '対象の島に誤差1HEXの範囲でステルスミサイルを発射します。相手の島はどの島から発射されたか分かリません。計画数を0にすると全弾発射します。',
  otherIsland: true,
  immediate: false,
  mapType: 'none',
  cost: 1000,
  costType: 'money',
  minTimes: 0,
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

    const result = executeMissile({
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

    return {
      nextPlan: this.immediate,
      log: result.logs,
      missileMonsterKills: result.monsterKills,
      missileCityKills: result.cityKills,
      missileDestroyedMaps: result.destroyedMaps,
      missileKilledMonsters: result.killedMonsters,
      missileRefugeesAccepted: result.refugeeAccepted,
    };
  },
};

export const ldMissile: planType = {
  planNo: 204,
  type: 'ld_missile',
  coordinate: true,
  category: '攻撃',
  name: '陸地破壊爆弾発射',
  description:
    '対象の島の陸地を海に沈める誤差2HEXの範囲で着弾する爆弾を発射します。海底基地も破壊可能です。計画数を0にすると全弾発射します。',
  otherIsland: true,
  immediate: false,
  mapType: 'none',
  cost: 2000,
  costType: 'money',
  minTimes: 0,
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

    const result = executeMissile({
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

    return {
      nextPlan: this.immediate,
      log: result.logs,
      missileMonsterKills: result.monsterKills,
      missileCityKills: result.cityKills,
      missileDestroyedMaps: result.destroyedMaps,
      missileKilledMonsters: result.killedMonsters,
      missileRefugeesAccepted: result.refugeeAccepted,
    };
  },
};

export const sendMonster: planType = {
  planNo: 299,
  type: 'send_monster',
  coordinate: false,
  category: '攻撃',
  name: '怪獣派遣',
  description:
    '対象の島へ人造怪獣を派遣します。派遣された怪獣は対象の島でメカいのらとして出現します。',
  otherIsland: true,
  immediate: false,
  mapType: 'none',
  cost: 3000,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using fromIslandGetSet = islandDataGetSet(uuid.fromIsland);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`派遣元の島情報が見つかりません。uuid=${uuid.fromIsland}`);

    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`派遣先の島情報が見つかりません。uuid=${uuid.toIsland}`);

    const validConstAndLand = validCostAndLandType(fromIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    toIsland.artificialMonster += 1;
    fromIsland.money -= this.cost;
    const baseLog = getBaseLog(turn, fromIsland, toIsland);
    const log = logCommonAid(fromIsland, toIsland, this, 1);
    plan.times = 0;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
