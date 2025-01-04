import { changeMapData, mapArrayConverter } from '@/global/function/island';
import { logAnyTimesDev, logCommonDev, logForest, logSetSelfCrash } from '../logType';
import { getMapDefine } from '../mapType';
import { hasSufficientCosts, planInfo, planType, validCostAndLandType } from '../planType';

export const afforest: planType = {
  type: 'afforest',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const { defVal } = getMapDefine('forest');
    changeMapData(toIsland, x, y, 'forest', { type: 'ins', value: defVal });
    // 費用の支払い
    toIsland.money -= this.cost;
    // ログ出力
    const log = logCommonDev(toIsland, this, x, y);
    const forest = logForest(toIsland);

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
  },
};
export const immediateAfforest: planType = {
  type: 'immediate_afforest',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const { defVal } = getMapDefine('forest');
    changeMapData(toIsland, x, y, 'forest', { type: 'ins', value: defVal });
    // 費用の支払い
    toIsland.money -= this.cost;
    // ログ出力
    const log = logCommonDev(toIsland, this, x, y);
    const forest = logForest(toIsland);

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
  },
};

export const farmDev: planType = {
  type: 'farm_dev',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    switch (mapInfo.type) {
      case 'plains': {
        const { defVal } = getMapDefine('farm');
        changeMapData(toIsland, x, y, 'farm', { type: 'ins', value: defVal });
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
          changeMapData(toIsland, x, y, 'farm', { type: 'add', value: addValue });
        }
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
    }
    // ログ出力
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const log = logCommonDev(toIsland, this, x, y);

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
export const immediateFarmDev: planType = {
  type: 'immediate_farm_dev',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland, times } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    // 開発回数
    let devCount = 0;
    for (let i = 0; i < times + 1; i++) {
      switch (mapInfo.type) {
        case 'plains': {
          const { defVal } = getMapDefine('farm');
          changeMapData(toIsland, x, y, 'farm', { type: 'ins', value: defVal });
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
            changeMapData(toIsland, x, y, 'farm', { type: 'add', value: addValue });
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
    const log = logAnyTimesDev(toIsland, this, x, y, devCount);

    return {
      nextPlan: this.immediate,
      log: [{ ...baseLog, secret_log: log, log: log }],
    };
  },
};

export const factoryDev: planType = {
  type: 'factory_dev',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    switch (mapInfo.type) {
      case 'plains': {
        const { defVal } = getMapDefine('factory');
        changeMapData(toIsland, x, y, 'factory', { type: 'ins', value: defVal });
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
          changeMapData(toIsland, x, y, 'factory', { type: 'add', value: addValue });
        }
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
    }
    // ログ出力
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const log = logCommonDev(toIsland, this, x, y);

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
export const immediateFactoryDev: planType = {
  type: 'immediate_factory_dev',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland, times } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    // 開発回数
    let devCount = 0;
    for (let i = 0; i < times + 1; i++) {
      switch (mapInfo.type) {
        case 'plains': {
          const { defVal } = getMapDefine('factory');
          changeMapData(toIsland, x, y, 'factory', { type: 'ins', value: defVal });
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
            changeMapData(toIsland, x, y, 'factory', { type: 'add', value: addValue });
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
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const log = logAnyTimesDev(toIsland, this, x, y, devCount);

    return {
      nextPlan: this.immediate,
      log: [{ ...baseLog, secret_log: log, log: log }],
    };
  },
};

export const miningDev: planType = {
  type: 'mining_dev',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    switch (mapInfo.type) {
      case 'mountain': {
        const { defVal } = getMapDefine('mining');
        changeMapData(toIsland, x, y, 'mining', { type: 'ins', value: defVal });
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
          changeMapData(toIsland, x, y, 'mining', { type: 'add', value: addValue });
        }
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
    }
    // ログ出力
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const log = logCommonDev(toIsland, this, x, y);

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
export const immediateMiningDev: planType = {
  type: 'immediate_mining_dev',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland, times } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    // 開発回数
    let devCount = 0;
    for (let i = 0; i < times + 1; i++) {
      switch (mapInfo.type) {
        case 'mountain': {
          const { defVal } = getMapDefine('mining');
          changeMapData(toIsland, x, y, 'mining', { type: 'ins', value: defVal });
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
            changeMapData(toIsland, x, y, 'mining', { type: 'add', value: addValue });
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
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const log = logAnyTimesDev(toIsland, this, x, y, devCount);

    return {
      nextPlan: this.immediate,
      log: [{ ...baseLog, secret_log: log, log: log }],
    };
  },
};

export const missileDev: planType = {
  type: 'missile_dev',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const { defVal } = getMapDefine('missile');
    changeMapData(toIsland, x, y, 'missile', { type: 'ins', value: defVal });
    // 費用の支払い
    toIsland.money -= this.cost;
    // ログ出力
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const log = logCommonDev(toIsland, this, x, y);
    const forest = logForest(toIsland);

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
  },
};
export const immediateMissileDev: planType = {
  type: 'immediate_missile_dev',
  category: '建設',
  name: '高速ミサイル基地建設',
  otherIsland: false,
  immediate: false,
  mapType: ['plains'],
  cost: 800,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const { defVal } = getMapDefine('missile');
    changeMapData(toIsland, x, y, 'missile', { type: 'ins', value: defVal });
    // 費用の支払い
    toIsland.money -= this.cost;
    // ログ出力
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const log = logCommonDev(toIsland, this, x, y);
    const forest = logForest(toIsland);

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
  },
};

export const defenseBaseDev: planType = {
  type: 'defense_base_dev',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    switch (mapInfo.type) {
      case 'defense_base': {
        // 自爆セット
        changeMapData(toIsland, x, y, 'defense_base', { type: 'ins', value: -1 });
        const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
        const log = logSetSelfCrash(toIsland, this, x, y);
        return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
      }
      default: {
        // 防衛施設の設置
        const { defVal } = getMapDefine('defense_base');
        changeMapData(toIsland, x, y, 'defense_base', { type: 'ins', value: defVal });
        // 費用の支払い
        toIsland.money -= this.cost;
        // ログ出力
        const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
        const log = logCommonDev(toIsland, this, x, y);
        const forest = logForest(toIsland);
        return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
      }
    }
  },
};
export const immediateDefenseBaseDev: planType = {
  type: 'immediate_defense_base_dev',
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
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    switch (mapInfo.type) {
      case 'defense_base': {
        // 自爆セット
        changeMapData(toIsland, x, y, 'defense_base', { type: 'ins', value: -1 });
        const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
        const log = logSetSelfCrash(toIsland, this, x, y);
        return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
      }
      default: {
        // 防衛施設の設置
        const { defVal } = getMapDefine('defense_base');
        changeMapData(toIsland, x, y, 'defense_base', { type: 'ins', value: defVal });
        // 費用の支払い
        toIsland.money -= this.cost;
        // ログ出力
        const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
        const log = logCommonDev(toIsland, this, x, y);
        const forest = logForest(toIsland);
        return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: forest }] };
      }
    }
  },
};

export const submarineMissileDev: planType = {
  type: 'submarine_missile_dev',
  category: '建設',
  name: '海底基地建設',
  otherIsland: false,
  immediate: true,
  mapType: ['sea'],
  cost: 8000,
  costType: 'money',
  minTimes: 1,
  maxTimes: 1,
  maxTimesPerTurn: 1,
  changeData: function (x: number, y: number, turn: number, info: planInfo) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // 費用の支払い
    toIsland.money -= this.cost;
    // マップの変更
    const { defVal } = getMapDefine('submarine_missile');
    changeMapData(toIsland, x, y, 'submarine_missile', { type: 'ins', value: defVal });
    // ログ出力
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const log = logCommonDev(toIsland, this, x, y);
    const secretLog = logCommonDev(toIsland, this, x, y, true);
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: secretLog, log: log }] };
  },
};
