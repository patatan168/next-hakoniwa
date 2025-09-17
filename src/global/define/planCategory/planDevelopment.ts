import { changeMapData, countMapAround, mapArrayConverter } from '@/global/function/island';
import { getBaseLog } from '@/global/function/turnProgress';
import { checkProbability } from '@/global/function/utility';
import { logCommonDev, logLackCosts, logNoLandAround, logTreasure } from '../logType';
import { getMapDefine } from '../mapType';
import META_DATA from '../metadata';
import { changeDataArgs, hasSufficientCosts, planType, validCostAndLandType } from '../planType';

export const leveling: planType = {
  planNo: 0,
  type: 'leveling',
  coordinate: true,
  category: '開発',
  name: '整地',
  otherIsland: false,
  immediate: false,
  mapType: [
    'defense_base',
    'fake_defense_base',
    'factory',
    'farm',
    'plains',
    'people',
    'ruins',
    'wasteland',
  ],
  cost: 5,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, info, eventRate }: changeDataArgs) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    changeMapData(toIsland, plan.x, plan.y, 'plains', { type: 'ins', value: 0 });
    // 費用の支払い
    toIsland.money -= this.cost;
    // 埋蔵金をもらえるかどうか
    const { buried_treasure } = eventRate;
    const isTreasure = checkProbability(buried_treasure);
    const baseLog = () => getBaseLog(turn, toIsland);
    if (isTreasure) {
      // 100~1000億円のお金を手に入れる
      const getMoney = 100 + Math.trunc(Math.random() * 901);
      toIsland.money += 100 + getMoney;
      const log = logCommonDev(toIsland, this, plan.x, plan.y);
      const logTreas = logTreasure(toIsland, plan.x, plan.y, getMoney);
      // 計画回数のデクリメント
      plan.times--;

      return {
        nextPlan: this.immediate,
        log: [
          { ...baseLog(), secret_log: log, log: log },
          { ...baseLog(), secret_log: logTreas, log: logTreas },
        ],
      };
    } else {
      const log = logCommonDev(toIsland, this, plan.x, plan.y);
      // 計画回数のデクリメント
      plan.times--;

      return {
        nextPlan: this.immediate,
        log: [{ ...baseLog(), secret_log: log, log: log }],
      };
    }
  },
};
export const immediateLeveling: planType = {
  planNo: 1,
  type: 'immediate_leveling',
  coordinate: true,
  category: '開発',
  name: '地ならし',
  otherIsland: false,
  immediate: true,
  mapType: [
    'defense_base',
    'fake_defense_base',
    'factory',
    'farm',
    'plains',
    'people',
    'ruins',
    'wasteland',
  ],
  cost: 100,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 1,
  unit: '回',
  changeData: function ({ plan, turn, info, eventRate }: changeDataArgs) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    // マップの変更
    const baseLog = getBaseLog(turn, toIsland);
    changeMapData(toIsland, plan.x, plan.y, 'plains', { type: 'ins', value: 0 });
    // 地震発生率を加算する
    eventRate.earthquake += 0.1;
    // 費用の支払い
    toIsland.money -= this.cost;
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    // 計画回数の初期化
    plan.times = 0;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};

export const landfill: planType = {
  planNo: 2,
  type: 'landfill',
  coordinate: true,
  category: '開発',
  name: '埋め立て',
  otherIsland: false,
  immediate: false,
  mapType: ['oil_field', 'sea', 'shallows', 'submarine_missile'],
  cost: 150,
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
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    // 周囲に陸地があるか
    let isLandAround = true;
    switch (mapInfo.type) {
      case 'oil_field':
      case 'submarine_missile': {
        changeMapData(toIsland, plan.x, plan.y, 'sea', { type: 'ins', value: 0 });
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
      case 'shallows':
      case 'sea': {
        if (countMapAround(toIsland.island_info, 'sea', plan.x, plan.y, 1) < 7) {
          // 海の場合は浅瀬、浅瀬の場合は荒地に変更
          const mapType = mapInfo.type === 'sea' ? 'shallows' : 'wasteland';
          changeMapData(toIsland, plan.x, plan.y, mapType, { type: 'ins', value: 0 });
          // 費用の支払い
          toIsland.money -= this.cost;
        } else {
          isLandAround = false;
        }
        break;
      }
    }
    // ログ出力
    const log = isLandAround
      ? logCommonDev(toIsland, this, plan.x, plan.y)
      : logNoLandAround(toIsland, this, plan.x, plan.y);

    if (isLandAround) {
      // 計画回数のデクリメント
      plan.times--;
    } else {
      // 計画回数の初期化
      plan.times = 0;
    }

    return {
      nextPlan: this.immediate || !isLandAround,
      log: [{ ...baseLog, secret_log: log, log: log }],
    };
  },
};
export const immediateLandfill: planType = {
  planNo: 3,
  type: 'immediate_landfill',
  coordinate: true,
  category: '開発',
  name: '高速埋め立て',
  otherIsland: false,
  immediate: true,
  mapType: ['oil_field', 'sea', 'shallows', 'submarine_missile'],
  cost: 450,
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
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    // 周囲に陸地があるか
    let isLandAround = true;
    switch (mapInfo.type) {
      case 'oil_field':
      case 'submarine_missile': {
        changeMapData(toIsland, plan.x, plan.y, 'sea', { type: 'ins', value: 0 });
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
      case 'shallows':
      case 'sea': {
        if (countMapAround(toIsland.island_info, 'sea', plan.x, plan.y, 1) < 7) {
          // 海の場合は浅瀬、浅瀬の場合は荒地に変更
          const mapType = mapInfo.type === 'sea' ? 'shallows' : 'wasteland';
          changeMapData(toIsland, plan.x, plan.y, mapType, { type: 'ins', value: 0 });
          // 費用の支払い
          toIsland.money -= this.cost;
        } else {
          isLandAround = false;
        }
        break;
      }
    }
    // ログ出力
    const log = isLandAround
      ? logCommonDev(toIsland, this, plan.x, plan.y)
      : logNoLandAround(toIsland, this, plan.x, plan.y);

    // 計画回数の初期化
    plan.times = 0;

    return {
      nextPlan: this.immediate || !isLandAround,
      log: [{ ...baseLog, secret_log: log, log: log }],
    };
  },
};

export const drilling: planType = {
  planNo: 4,
  type: 'drilling',
  coordinate: true,
  category: '開発',
  name: '掘削',
  otherIsland: false,
  immediate: false,
  mapType: 'all',
  excludeLandType: ['submarine_missile', 'oil_field', 'monster', 'kujira', 'sanjira'],
  cost: 150,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 'infinity',
  unit: '回',
  changeData: function ({ plan, turn, info, eventRate }: changeDataArgs) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    const baseLog = () => getBaseLog(turn, toIsland);
    const arrayNum = mapArrayConverter(plan.x, plan.y);
    // 島情報
    const island_info = toIsland.island_info[arrayNum];
    // 基本地形
    const baseLand = getMapDefine(island_info.type).baseLand;
    // ログ
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    const result = [{ ...baseLog(), secret_log: log, log: log }];

    // 海を採掘した回数
    let seaDrillingCount = 0;
    // 油田が見つかったかどうか
    let oilFieldFound = false;
    for (let i = 0; i < plan.times; i++) {
      switch (baseLand) {
        case 'plains': {
          changeMapData(toIsland, plan.x, plan.y, 'shallows', { type: 'ins', value: 0 });
          // 費用の支払い
          toIsland.money -= this.cost;
          break;
        }
        case 'mountain': {
          changeMapData(toIsland, plan.x, plan.y, 'wasteland', { type: 'ins', value: 0 });
          // 費用の支払い
          toIsland.money -= this.cost;
          break;
        }
        case 'sea':
          {
            const { type } = island_info;
            if (type === 'sea') {
              if (!oilFieldFound) {
                // 油田が発見されるかどうか
                const { oil_field } = eventRate;
                const isOilField = checkProbability(oil_field);
                if (isOilField) {
                  changeMapData(toIsland, plan.x, plan.y, 'oil_field', { type: 'ins', value: 0 });
                  oilFieldFound = true;
                }
              }
              // 費用の支払い
              toIsland.money -= this.cost;
              seaDrillingCount++;
            } else {
              changeMapData(toIsland, plan.x, plan.y, 'sea', { type: 'ins', value: 0 });
              // 費用の支払い
              toIsland.money -= this.cost;
            }
          }
          break;
      }
      // 資金不足の場合は中止
      if (!hasSufficientCosts(toIsland, this)) {
        const { type } = island_info;
        // 海まで掘削できなかったら資金不足のログを追加する
        if (type !== 'sea') {
          const log = logLackCosts(toIsland, this);
          result.push({ ...baseLog(), secret_log: log, log: log });
        }
        break;
      }
    }
    // 油田チャレンジの結果
    if (seaDrillingCount > 0) {
      const seaDrillingLog = oilFieldFound
        ? '、油田が掘り当てられました。'
        : 'ましたが、油田は見つかりませんでした。';
      const drillingLog = `${toIsland.island_name}島(${plan.x}, ${plan.y})で${this.cost * seaDrillingCount}の予算をつぎ込んだ掘削が行われ${seaDrillingLog}`;
      result.push({ ...baseLog(), secret_log: drillingLog, log: drillingLog });
    }
    // 計画回数の初期化
    plan.times = 0;

    return { nextPlan: this.immediate, log: result };
  },
};
export const immediateDrilling: planType = {
  planNo: 5,
  type: 'immediate_drilling',
  coordinate: true,
  category: '開発',
  name: '高速掘削',
  otherIsland: false,
  immediate: true,
  mapType: 'all',
  excludeLandType: ['submarine_missile', 'oil_field', 'monster', 'kujira', 'sanjira'],
  cost: 600,
  costType: 'money',
  minTimes: 1,
  maxTimes: 99,
  maxTimesPerTurn: 'infinity',
  unit: '回',
  changeData: function ({ plan, turn, info, eventRate }: changeDataArgs) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, plan.x, plan.y, turn);
    if (validConstAndLand.nextPlan) {
      plan.times = 0;
      return validConstAndLand;
    }

    const baseLog = () => getBaseLog(turn, toIsland);
    const arrayNum = mapArrayConverter(plan.x, plan.y);
    // 島情報
    const island_info = toIsland.island_info[arrayNum];
    // 基本地形
    const baseLand = getMapDefine(island_info.type).baseLand;
    // ログ
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    const result = [{ ...baseLog(), secret_log: log, log: log }];

    // 海を採掘した回数
    let seaDrillingCount = 0;
    // 油田が見つかったかどうか
    let oilFieldFound = false;
    for (let i = 0; i < plan.times; i++) {
      switch (baseLand) {
        case 'plains': {
          changeMapData(toIsland, plan.x, plan.y, 'shallows', { type: 'ins', value: 0 });
          // 費用の支払い
          toIsland.money -= this.cost;
          break;
        }
        case 'mountain': {
          changeMapData(toIsland, plan.x, plan.y, 'wasteland', { type: 'ins', value: 0 });
          // 費用の支払い
          toIsland.money -= this.cost;
          break;
        }
        case 'sea': {
          const { type } = island_info;
          if (type === 'sea') {
            if (!oilFieldFound) {
              // 油田が発見されるかどうか
              const { oil_field } = eventRate;
              const isOilField = checkProbability(oil_field);
              if (isOilField) {
                changeMapData(toIsland, plan.x, plan.y, 'oil_field', { type: 'ins', value: 0 });
                oilFieldFound = true;
              }
            }
            // 費用の支払い
            toIsland.money -= this.cost;
            seaDrillingCount++;
          } else {
            changeMapData(toIsland, plan.x, plan.y, 'sea', { type: 'ins', value: 0 });
            // 費用の支払い
            toIsland.money -= this.cost;
          }
          break;
        }
      }
      // 資金不足の場合は中止
      if (!hasSufficientCosts(toIsland, this)) {
        const { type } = island_info;
        // 海まで掘削できなかったら資金不足のログを追加する
        if (type !== 'sea') {
          const log = logLackCosts(toIsland, this);
          result.push({ ...baseLog(), secret_log: log, log: log });
        }
        break;
      }
    }
    // 油田チャレンジの結果
    if (seaDrillingCount > 0) {
      const seaDrillingLog = oilFieldFound
        ? '、油田が掘り当てられました。'
        : 'ましたが、油田は見つかりませんでした。';
      const drillingLog = `${toIsland.island_name}島(${plan.x}, ${plan.y})で${this.cost * seaDrillingCount}の予算をつぎ込んだ掘削が行われ${seaDrillingLog}`;
      result.push({ ...baseLog(), secret_log: drillingLog, log: drillingLog });
    }
    // 計画回数の初期化
    plan.times = 0;

    return { nextPlan: this.immediate, log: result };
  },
};

export const logging: planType = {
  planNo: 6,
  type: 'logging',
  coordinate: true,
  category: '開発',
  name: '伐採',
  otherIsland: false,
  immediate: false,
  mapType: ['forest'],
  cost: 0,
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

    // 伐採の収入を得る
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    toIsland.money += mapInfo.landValue * META_DATA.FOREST_VALUE;
    // マップの変更
    changeMapData(toIsland, plan.x, plan.y, 'plains', { type: 'ins', value: 0 });
    // ログ出力
    const baseLog = getBaseLog(turn, toIsland);
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    // 計画回数のデクリメント
    plan.times--;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
export const immediateLogging: planType = {
  planNo: 7,
  type: 'immediate_logging',
  coordinate: true,
  category: '開発',
  name: '高速伐採',
  otherIsland: false,
  immediate: true,
  mapType: ['forest'],
  cost: 100,
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
    // 伐採の収入を得る
    const mapInfo = toIsland.island_info[mapArrayConverter(plan.x, plan.y)];
    toIsland.money += mapInfo.landValue * META_DATA.FOREST_VALUE;
    // マップの変更
    changeMapData(toIsland, plan.x, plan.y, 'plains', { type: 'ins', value: 0 });
    // ログ出力
    const baseLog = getBaseLog(turn, toIsland);
    const log = logCommonDev(toIsland, this, plan.x, plan.y);
    // 計画回数の初期化
    plan.times = 0;

    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
