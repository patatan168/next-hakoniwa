/**
 * @module planConstruction
 * @description 建設系計画の定義。
 */
import { getBaseLog } from '@/global/define/logType';
import { changeMapData, mapArrayConverter } from '@/global/function/island';
import { islandDataGetSet } from '@/global/store/turnProgress';
import {
  logAnyTimesDev,
  logCommonDev,
  logForest,
  logMonumentLaunch,
  logSetSelfCrash,
} from '../logType';
import { getMapDefine } from '../mapType';
import { changeDataArgs, hasSufficientCosts, planType, validCostAndLandType } from '../planType';

export const afforest: planType = {
  planNo: 0,
  type: 'afforest',
  coordinate: true,
  category: '建設',
  name: '植林',
  description:
    '平地に木を植え、森にします。森は伐採で資金をることができる他、周辺の火災・台風による被害を軽減します。',
  otherIsland: false,
  immediate: false,
  mapType: ['plains'],
  cost: 50,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  predictLandType: (t) => (t === 'plains' ? 'forest' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const baseLog = getBaseLog(turn, toIsland);
    const { defVal } = getMapDefine('forest');
    changeMapData(toIsland, plan.x, plan.y, 'forest', { type: 'ins', value: defVal });
    // 費用の支払い
    toIsland.money -= this.cost;
    // ログ出力
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    const forest = logForest(toIsland);
    // 計画回数のデクリメント
    plan.times--;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
  },
};
export const immediateAfforest: planType = {
  planNo: 1,
  type: 'immediate_afforest',
  coordinate: true,
  category: '建設',
  name: '高速植林',
  description:
    '即座に平地を森にします。通常の植林より早く完了しますが、より多くの費用がかかります。',
  otherIsland: false,
  immediate: true,
  mapType: ['plains'],
  cost: 300,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  predictLandType: (t) => (t === 'plains' ? 'forest' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const baseLog = getBaseLog(turn, toIsland);
    const { defVal } = getMapDefine('forest');
    changeMapData(toIsland, plan.x, plan.y, 'forest', { type: 'ins', value: defVal });
    // 費用の支払い
    toIsland.money -= this.cost;
    // ログ出力
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    const forest = logForest(toIsland);
    // 計画回数の初期化
    plan.times = 0;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
  },
};

export const farmDev: planType = {
  planNo: 2,
  type: 'farm_dev',
  coordinate: true,
  category: '建設',
  name: '農場整備',
  description:
    '平地に農場を建設し、人口に応じた食料を生産します。すでに農場の場合は規模を拡大し、一度により多くの食料を生産できるようにします。',
  otherIsland: false,
  immediate: false,
  mapType: ['plains', 'farm'],
  cost: 20,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  predictLandType: (t) => (t === 'plains' ? 'farm' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    switch (mapInfo.type) {
      case 'plains': {
        const { defVal } = getMapDefine('farm');
        changeMapData(toIsland, plan.x, plan.y, 'farm', { type: 'ins', value: defVal });
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
      case 'farm': {
        const { maxVal } = getMapDefine('farm');
        // 加算する施設の値
        const addValue = 1;
        // 最大値以下なら施設を加算する
        if (maxVal >= mapInfo.landValue + addValue) {
          changeMapData(toIsland, plan.x, plan.y, 'farm', { type: 'add', value: addValue });
        }
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
    }
    // ログ出力
    const baseLog = getBaseLog(turn, toIsland);
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    // 計画回数のデクリメント
    plan.times--;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
export const immediateFarmDev: planType = {
  planNo: 3,
  type: 'immediate_farm_dev',
  coordinate: true,
  category: '建設',
  name: '高速農場整備',
  description:
    '即座に農場の建設または規模拡大を行います。指定した回数分だけターンを消費せずに連続で実行できますが、費用は割高です。',
  otherIsland: false,
  immediate: true,
  mapType: ['plains', 'farm'],
  cost: 400,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 'infinity',
  unit: '回',
  predictLandType: (t) => (t === 'plains' ? 'farm' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const baseLog = getBaseLog(turn, toIsland);
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    // 開発回数
    let devCount = 0;
    for (let i = 0; i < plan.times; i++) {
      switch (mapInfo.type) {
        case 'plains': {
          const { defVal } = getMapDefine('farm');
          changeMapData(toIsland, plan.x, plan.y, 'farm', { type: 'ins', value: defVal });
          // 費用の支払い
          toIsland.money -= this.cost;
          devCount++;
          break;
        }
        case 'farm': {
          const { maxVal } = getMapDefine('farm');
          // 加算する施設の値
          const addValue = 1;
          // 最大値以下なら施設を加算する
          if (maxVal >= mapInfo.landValue + addValue) {
            changeMapData(toIsland, plan.x, plan.y, 'farm', { type: 'add', value: addValue });
          }
          // 費用の支払い
          toIsland.money -= this.cost;
          devCount++;
          break;
        }
      }
      // 資金不足の場合は中止
      if (!hasSufficientCosts(toIsland, this)) break;
    }
    // ログ出力
    const log = logAnyTimesDev(toIsland, this, plan.x, plan.y, devCount);
    // 計画回数の初期化
    plan.times = 0;

    return {
      nextPlan: this.immediate,
      log: [{ ...baseLog, secret_log: log, log: log }],
    };
  },
};

export const factoryDev: planType = {
  planNo: 4,
  type: 'factory_dev',
  coordinate: true,
  category: '建設',
  name: '工場建設',
  description:
    '平地に工場を建設し、人口に応じた資金を生産します。すでに工場の場合は規模を拡大し、一度により多くの資金を生産できるようにします。',
  otherIsland: false,
  immediate: false,
  mapType: ['plains', 'factory'],
  cost: 100,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  predictLandType: (t) => (t === 'plains' ? 'factory' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    switch (mapInfo.type) {
      case 'plains': {
        const { defVal } = getMapDefine('factory');
        changeMapData(toIsland, plan.x, plan.y, 'factory', { type: 'ins', value: defVal });
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
      case 'factory': {
        const { maxVal } = getMapDefine('factory');
        // 加算する施設の値
        const addValue = 1;
        // 最大値以下なら施設を加算する
        if (maxVal >= mapInfo.landValue + addValue) {
          changeMapData(toIsland, plan.x, plan.y, 'factory', { type: 'add', value: addValue });
        }
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
    }
    // ログ出力
    const baseLog = getBaseLog(turn, toIsland);
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    // 計画回数のデクリメント
    plan.times--;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
export const immediateFactoryDev: planType = {
  planNo: 5,
  type: 'immediate_factory_dev',
  coordinate: true,
  category: '建設',
  name: '高速工場建設',
  description:
    '即座に工場の建設または規模拡大を行います。指定した回数分だけターンを消費せずに連続で実行できますが、費用は割高です。',
  otherIsland: false,
  immediate: true,
  mapType: ['plains', 'factory'],
  cost: 600,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 'infinity',
  unit: '回',
  predictLandType: (t) => (t === 'plains' ? 'factory' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    // 開発回数
    let devCount = 0;
    for (let i = 0; i < plan.times; i++) {
      switch (mapInfo.type) {
        case 'plains': {
          const { defVal } = getMapDefine('factory');
          changeMapData(toIsland, plan.x, plan.y, 'factory', { type: 'ins', value: defVal });
          // 費用の支払い
          toIsland.money -= this.cost;
          devCount++;
          break;
        }
        case 'factory': {
          const { maxVal } = getMapDefine('factory');
          // 加算する施設の値
          const addValue = 1;
          // 最大値以下なら施設を加算する
          if (maxVal >= mapInfo.landValue + addValue) {
            changeMapData(toIsland, plan.x, plan.y, 'factory', { type: 'add', value: addValue });
          }
          // 費用の支払い
          toIsland.money -= this.cost;
          devCount++;
          break;
        }
      }
      // 資金不足の場合は中止
      if (!hasSufficientCosts(toIsland, this)) break;
    }
    // ログ出力
    const baseLog = getBaseLog(turn, toIsland);
    const log = logAnyTimesDev(toIsland, this, plan.x, plan.y, devCount);
    // 計画回数の初期化
    plan.times = 0;

    return {
      nextPlan: this.immediate,
      log: [{ ...baseLog, secret_log: log, log: log }],
    };
  },
};

export const miningDev: planType = {
  planNo: 6,
  type: 'mining_dev',
  coordinate: true,
  category: '建設',
  name: '採掘場整備',
  description: '山を採掘場にします。すでに採掘場の場合は規模を拡大します。',
  otherIsland: false,
  immediate: false,
  mapType: ['mountain', 'mining'],
  cost: 300,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  predictLandType: (t) => (t === 'mountain' ? 'mining' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    switch (mapInfo.type) {
      case 'mountain': {
        const { defVal } = getMapDefine('mining');
        changeMapData(toIsland, plan.x, plan.y, 'mining', { type: 'ins', value: defVal });
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
      case 'mining': {
        const { maxVal } = getMapDefine('mining');
        // 加算する施設の値
        const addValue = 1;
        // 最大値以下なら施設を加算する
        if (maxVal >= mapInfo.landValue + addValue) {
          changeMapData(toIsland, plan.x, plan.y, 'mining', { type: 'add', value: addValue });
        }
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
    }
    // ログ出力
    const baseLog = getBaseLog(turn, toIsland);
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    // 計画回数のデクリメント
    plan.times--;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
export const immediateMiningDev: planType = {
  planNo: 7,
  type: 'immediate_mining_dev',
  coordinate: true,
  category: '建設',
  name: '高速採掘場整備',
  description:
    '即座に採掘場の建設または規模拡大を行います。指定した回数分だけ連続で実行できますが、通常の整備より費用がかかります。',
  otherIsland: false,
  immediate: true,
  mapType: ['mountain', 'mining'],
  cost: 800,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 'infinity',
  unit: '回',
  predictLandType: (t) => (t === 'mountain' ? 'mining' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    // 開発回数
    let devCount = 0;
    for (let i = 0; i < plan.times; i++) {
      switch (mapInfo.type) {
        case 'mountain': {
          const { defVal } = getMapDefine('mining');
          changeMapData(toIsland, plan.x, plan.y, 'mining', { type: 'ins', value: defVal });
          // 費用の支払い
          toIsland.money -= this.cost;
          devCount++;
          break;
        }
        case 'mining': {
          const { maxVal } = getMapDefine('mining');
          // 加算する施設の値
          const addValue = 1;
          // 最大値以下なら施設を加算する
          if (maxVal >= mapInfo.landValue + addValue) {
            changeMapData(toIsland, plan.x, plan.y, 'mining', { type: 'add', value: addValue });
          }
          // 費用の支払い
          toIsland.money -= this.cost;
          devCount++;
          break;
        }
      }
      // 資金不足の場合は中止
      if (!hasSufficientCosts(toIsland, this)) break;
    }
    // ログ出力
    const baseLog = getBaseLog(turn, toIsland);
    const log = logAnyTimesDev(toIsland, this, plan.x, plan.y, devCount);
    // 計画回数の初期化
    plan.times = 0;

    return {
      nextPlan: this.immediate,
      log: [{ ...baseLog, secret_log: log, log: log }],
    };
  },
};

export const missileDev: planType = {
  planNo: 9,
  type: 'missile_dev',
  coordinate: true,
  category: '建設',
  name: 'ミサイル基地建設',
  description:
    '平地にミサイル基地を建設します。ミサイル攻撃を行うために必要となり、レベルが高いほど、多くのミサイルを発射できます。',
  otherIsland: false,
  immediate: false,
  mapType: ['plains'],
  cost: 300,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  predictLandType: (t) => (t === 'plains' ? 'missile' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const { defVal } = getMapDefine('missile');
    changeMapData(toIsland, plan.x, plan.y, 'missile', { type: 'ins', value: defVal });
    // 費用の支払い
    toIsland.money -= this.cost;
    // ログ出力
    const baseLog = getBaseLog(turn, toIsland);
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    const forest = logForest(toIsland);
    // 計画回数のデクリメント
    plan.times--;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
  },
};
export const immediateMissileDev: planType = {
  planNo: 10,
  type: 'immediate_missile_dev',
  coordinate: true,
  category: '建設',
  name: '高速ミサイル基地建設',
  description:
    '即座にミサイル基地を建設します。ターンの経過を待たずに建設できますが、割高な費用がかかります。',
  otherIsland: false,
  immediate: true,
  mapType: ['plains'],
  cost: 800,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  predictLandType: (t) => (t === 'plains' ? 'missile' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const { defVal } = getMapDefine('missile');
    changeMapData(toIsland, plan.x, plan.y, 'missile', { type: 'ins', value: defVal });
    // 費用の支払い
    toIsland.money -= this.cost;
    // ログ出力
    const baseLog = getBaseLog(turn, toIsland);
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    const forest = logForest(toIsland);
    // 計画回数の初期化
    plan.times = 0;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
  },
};

export const defenseBaseDev: planType = {
  planNo: 11,
  type: 'defense_base_dev',
  coordinate: true,
  category: '建設',
  name: '防衛施設建設',
  description:
    '平地に防衛施設を建設し、他島からのミサイル攻撃を一定確率で迎撃できるようにします。すでに防衛施設がある場合は、周囲を巻き込んで自爆します。',
  otherIsland: false,
  immediate: false,
  mapType: ['plains', 'defense_base'],
  cost: 800,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  predictLandType: (t) =>
    t === 'plains' ? 'defense_base' : t === 'defense_base' ? 'wasteland' : t,
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    switch (mapInfo.type) {
      case 'defense_base': {
        // 自爆セット
        changeMapData(toIsland, plan.x, plan.y, 'defense_base', { type: 'ins', value: -1 });
        const baseLog = getBaseLog(turn, toIsland);
        const log = logSetSelfCrash(toIsland, this, plan.x, plan.y);
        // 計画回数のデクリメント
        plan.times--;
        return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
      }
      default: {
        // 防衛施設の設置
        const { defVal } = getMapDefine('defense_base');
        changeMapData(toIsland, plan.x, plan.y, 'defense_base', { type: 'ins', value: defVal });
        // 費用の支払い
        toIsland.money -= this.cost;
        // ログ出力
        const baseLog = getBaseLog(turn, toIsland);
        const log = logCommonDev(toIsland, this, plan.x, plan.y);
        const forest = logForest(toIsland);
        // 計画回数のデクリメント
        plan.times--;

        return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
      }
    }
  },
};
export const immediateDefenseBaseDev: planType = {
  planNo: 12,
  type: 'immediate_defense_base_dev',
  coordinate: true,
  category: '建設',
  name: '高速防衛施設建設',
  description: '即座に防衛施設を建設、または自爆を行います。',
  otherIsland: false,
  immediate: true,
  mapType: ['plains', 'defense_base'],
  cost: 2000,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  predictLandType: (t) =>
    t === 'plains' ? 'defense_base' : t === 'defense_base' ? 'wasteland' : t,
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    switch (mapInfo.type) {
      case 'defense_base': {
        // 自爆セット
        changeMapData(toIsland, plan.x, plan.y, 'defense_base', { type: 'ins', value: -1 });
        const baseLog = getBaseLog(turn, toIsland);
        const log = logSetSelfCrash(toIsland, this, plan.x, plan.y);
        // 計画回数の初期化
        plan.times = 0;

        return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
      }
      default: {
        // 防衛施設の設置
        const { defVal } = getMapDefine('defense_base');
        changeMapData(toIsland, plan.x, plan.y, 'defense_base', { type: 'ins', value: defVal });
        // 費用の支払い
        toIsland.money -= this.cost;
        // ログ出力
        const baseLog = getBaseLog(turn, toIsland);
        const log = logCommonDev(toIsland, this, plan.x, plan.y);
        const forest = logForest(toIsland);
        // 計画回数の初期化
        plan.times = 0;

        return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
      }
    }
  },
};

export const submarineMissileDev: planType = {
  planNo: 13,
  type: 'submarine_missile_dev',
  coordinate: true,
  category: '建設',
  name: '海底基地建設',
  description:
    '海に特殊な海底基地を建設します。海中に存在するため、ミサイル発射能力を持ちながらも怪獣に踏まれて破壊されることがありません。',
  otherIsland: false,
  immediate: false,
  mapType: ['sea'],
  cost: 8000,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  predictLandType: (t) => (t === 'sea' ? 'submarine_missile' : t),
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.toIsland}`);

    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // 費用の支払い
    toIsland.money -= this.cost;
    // マップの変更
    const { defVal } = getMapDefine('submarine_missile');
    changeMapData(toIsland, plan.x, plan.y, 'submarine_missile', { type: 'ins', value: defVal });
    // ログ出力
    const baseLog = getBaseLog(turn, toIsland);
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    const secretLog = logCommonDev(toIsland, this, plan.x, plan.y, true);
    // 計画回数のデクリメント
    plan.times--;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: secretLog, log: log }] };
  },
};

export const monumentDev: planType = {
  planNo: 998,
  type: 'monument_dev',
  coordinate: true,
  category: '建設',
  name: '記念碑建造',
  description:
    '平地にモノリスを建造します。すでにモノリスがある場所に対して実行すると、対象の島へモノリスを発射します。発射されたモノリスは巨大隕石と同等の被害を与えます。',
  otherIsland: true,
  immediate: false,
  mapType: ['plains', 'wasteland', 'ruins', 'monument'],
  cost: 9999,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  predictLandType: (t) => {
    if (t === 'plains' || t === 'wasteland' || t === 'ruins') return 'monument';
    if (t === 'monument') return 'wasteland';
    return t;
  },
  changeData: function ({ plan, turn, uuid }: changeDataArgs) {
    using fromIslandGetSet = islandDataGetSet(uuid.fromIsland);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`島情報が見つかりません。uuid=${uuid.fromIsland}`);

    // 資金不足の場合は中止
    const validResult = validCostAndLandType(fromIsland, this, plan.x, plan.y, turn);
    if (validResult.nextPlan) {
      plan.times = 0;
      return validResult;
    }

    const mapInfo = fromIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    const baseLog = getBaseLog(turn, fromIsland);

    if (mapInfo.type === 'monument') {
      // 既に記念碑がある場合: 発射モード
      using toIslandGetSet = islandDataGetSet(uuid.toIsland);
      const toIsland = toIslandGetSet.islandData;
      if (!toIsland) {
        // 対象の島が存在しない場合は中止
        plan.times = 0;
        return { nextPlan: true, log: [] };
      }

      // 記念碑を荒地に変更
      const { defVal } = getMapDefine('wasteland');
      changeMapData(fromIsland, plan.x, plan.y, 'wasteland', { type: 'ins', value: defVal });
      // 対象の島にモノリス落下を予約
      toIsland.fallMonument++;
      // 費用の支払い
      fromIsland.money -= this.cost;
      // ログ出力
      const log = logMonumentLaunch(fromIsland, toIsland, plan.x, plan.y);
      plan.times = 0;

      return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
    } else {
      // 新規建造
      const { defVal } = getMapDefine('monument');
      changeMapData(fromIsland, plan.x, plan.y, 'monument', { type: 'ins', value: defVal });
      // 費用の支払い
      fromIsland.money -= this.cost;
      // ログ出力
      const log = logCommonDev(fromIsland, this, plan.x, plan.y);
      plan.times = 0;

      return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
    }
  },
};
