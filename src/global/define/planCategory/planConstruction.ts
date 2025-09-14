import { changeMapData, mapArrayConverter } from '@/global/function/island';
import { getBaseLog } from '@/global/function/turnProgress';
import { logAnyTimesDev, logCommonDev, logForest, logSetSelfCrash } from '../logType';
import { getMapDefine } from '../mapType';
import { changeDataArgs, hasSufficientCosts, planType, validCostAndLandType } from '../planType';

export const afforest: planType = {
  planNo: 100,
  type: 'afforest',
  coordinate: true,
  category: '建設',
  name: '植林',
  otherIsland: false,
  immediate: false,
  mapType: ['plains'],
  cost: 50,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
  planNo: 101,
  type: 'immediate_afforest',
  coordinate: true,
  category: '建設',
  name: '高速植林',
  otherIsland: false,
  immediate: true,
  mapType: ['plains'],
  cost: 300,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
  planNo: 102,
  type: 'farm_dev',
  coordinate: true,
  category: '建設',
  name: '農場整備',
  otherIsland: false,
  immediate: false,
  mapType: ['plains', 'farm'],
  cost: 20,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
        const addValue = 2;
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
  planNo: 103,
  type: 'immediate_farm_dev',
  coordinate: true,
  category: '建設',
  name: '高速農場整備',
  otherIsland: false,
  immediate: true,
  mapType: ['plains', 'farm'],
  cost: 400,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 'infinity',
  unit: '回',
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
          const addValue = 2;
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
  planNo: 104,
  type: 'factory_dev',
  coordinate: true,
  category: '建設',
  name: '工場建設',
  otherIsland: false,
  immediate: false,
  mapType: ['plains', 'factory'],
  cost: 100,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
  planNo: 105,
  type: 'immediate_factory_dev',
  coordinate: true,
  category: '建設',
  name: '高速工場建設',
  otherIsland: false,
  immediate: true,
  mapType: ['plains', 'factory'],
  cost: 600,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 'infinity',
  unit: '回',
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
  planNo: 106,
  type: 'mining_dev',
  coordinate: true,
  category: '建設',
  name: '採掘場整備',
  otherIsland: false,
  immediate: false,
  mapType: ['mountain', 'mining'],
  cost: 300,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
        const addValue = 5;
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
  planNo: 107,
  type: 'immediate_mining_dev',
  coordinate: true,
  category: '建設',
  name: '高速採掘場整備',
  otherIsland: false,
  immediate: true,
  mapType: ['mountain', 'mining'],
  cost: 800,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 'infinity',
  unit: '回',
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
          const addValue = 5;
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
  planNo: 109,
  type: 'missile_dev',
  coordinate: true,
  category: '建設',
  name: 'ミサイル基地建設',
  otherIsland: false,
  immediate: false,
  mapType: ['plains'],
  cost: 300,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
  planNo: 110,
  type: 'immediate_missile_dev',
  coordinate: true,
  category: '建設',
  name: '高速ミサイル基地建設',
  otherIsland: false,
  immediate: true,
  mapType: ['plains'],
  cost: 800,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
  planNo: 111,
  type: 'defense_base_dev',
  coordinate: true,
  category: '建設',
  name: '防衛施設建設',
  otherIsland: false,
  immediate: false,
  mapType: ['plains', 'defense_base'],
  cost: 800,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
  planNo: 112,
  type: 'immediate_defense_base_dev',
  coordinate: true,
  category: '建設',
  name: '高速防衛施設建設',
  otherIsland: false,
  immediate: true,
  mapType: ['plains', 'defense_base'],
  cost: 2000,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
  planNo: 113,
  type: 'submarine_missile_dev',
  coordinate: true,
  category: '建設',
  name: '海底基地建設',
  otherIsland: false,
  immediate: false,
  mapType: ['sea'],
  cost: 8000,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  changeData: function ({ plan, turn, info }: changeDataArgs) {
    const { toIsland } = info;
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
