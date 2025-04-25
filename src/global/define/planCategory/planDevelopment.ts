import { changeMapData, countMapAround, mapArrayConverter } from '@/global/function/island';
import { checkProbability } from '@/global/function/utility';
import { logCommonDev, logLackCosts, logNoLandAround } from '../logType';
import { getMapDefine } from '../mapType';
import META_DATA from '../metadata';
import { changeDataArgs, hasSufficientCosts, planType, validCostAndLandType } from '../planType';

export const leveling: planType = {
  type: 'leveling',
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
  changeData: function ({ x, y, turn, info, eventRate }: changeDataArgs) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    changeMapData(toIsland, x, y, 'plains', { type: 'ins', value: 0 });
    // 費用の支払い
    toIsland.money -= this.cost;
    // 埋蔵金をもらえるかどうか
    const { buried_treasure } = eventRate;
    const isTreasure = checkProbability(buried_treasure);
    if (isTreasure) {
      // 100~1000億円のお金を手に入れる
      const getMoney = 100 + Math.trunc(Math.random() * 901);
      toIsland.money += 100 + getMoney;
      const log = logCommonDev(toIsland, this, x, y);
      const logTreasure = `${toIsland.island_name}島(${x}, ${y})での整地中に、${getMoney}${META_DATA.UNIT_MONEY}もの埋蔵金が発見されました。`;
      return {
        nextPlan: this.immediate,
        log: [
          { ...baseLog, secret_log: log, log: log },
          { ...baseLog, secret_log: logTreasure, log: logTreasure },
        ],
      };
    } else {
      const log = logCommonDev(toIsland, this, x, y);
      return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
    }
  },
};
export const immediateLeveling: planType = {
  type: 'immediate_leveling',
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
  changeData: function ({ x, y, turn, info, eventRate }: changeDataArgs) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    changeMapData(toIsland, x, y, 'plains', { type: 'ins', value: 0 });
    // 地震発生率を加算する
    eventRate.earthquake += 0.1;
    // 費用の支払い
    toIsland.money -= this.cost;
    const log = logCommonDev(toIsland, this, x, y);
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};

export const landfill: planType = {
  type: 'landfill',
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
  changeData: function ({ x, y, turn, info }: changeDataArgs) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    // 周囲に陸地があるか
    let isLandAround = true;
    switch (mapInfo.type) {
      case 'oil_field':
      case 'submarine_missile': {
        changeMapData(toIsland, x, y, 'sea', { type: 'ins', value: 0 });
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
      case 'shallows':
      case 'sea': {
        if (countMapAround(toIsland.island_info, 'sea', x, y, 1) < 7) {
          // 海の場合は浅瀬、浅瀬の場合は荒地に変更
          const mapType = mapInfo.type === 'sea' ? 'shallows' : 'wasteland';
          changeMapData(toIsland, x, y, mapType, { type: 'ins', value: 0 });
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
      ? logCommonDev(toIsland, this, x, y)
      : logNoLandAround(toIsland, this, x, y);
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
export const immediateLandfill: planType = {
  type: 'immediate_landfill',
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
  changeData: function ({ x, y, turn, info }: changeDataArgs) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // マップの変更
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    // 周囲に陸地があるか
    let isLandAround = true;
    switch (mapInfo.type) {
      case 'oil_field':
      case 'submarine_missile': {
        changeMapData(toIsland, x, y, 'sea', { type: 'ins', value: 0 });
        // 費用の支払い
        toIsland.money -= this.cost;
        break;
      }
      case 'shallows':
      case 'sea': {
        if (countMapAround(toIsland.island_info, 'sea', x, y, 1) < 7) {
          // 海の場合は浅瀬、浅瀬の場合は荒地に変更
          const mapType = mapInfo.type === 'sea' ? 'shallows' : 'wasteland';
          changeMapData(toIsland, x, y, mapType, { type: 'ins', value: 0 });
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
      ? logCommonDev(toIsland, this, x, y)
      : logNoLandAround(toIsland, this, x, y);
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};

export const drilling: planType = {
  type: 'drilling',
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
  changeData: function ({ x, y, turn, info, eventRate }: changeDataArgs) {
    const { times, toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const arrayNum = mapArrayConverter(x, y);
    // 島情報
    const island_info = toIsland.island_info[arrayNum];
    // 基本地形
    const baseLand = getMapDefine(island_info.type).baseLand;
    // ログ
    const log = logCommonDev(toIsland, this, x, y);
    const result = [{ ...baseLog, secret_log: log, log: log }];

    // 海を採掘した回数
    let seaDrillingCount = 0;
    // 油田が見つかったかどうか
    let oilFieldFound = false;
    for (let i = 0; i < times + 1; i++) {
      switch (baseLand) {
        case 'plains': {
          changeMapData(toIsland, x, y, 'shallows', { type: 'ins', value: 0 });
          // 費用の支払い
          toIsland.money -= this.cost;
          break;
        }
        case 'mountain': {
          changeMapData(toIsland, x, y, 'wasteland', { type: 'ins', value: 0 });
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
                  changeMapData(toIsland, x, y, 'oil_field', { type: 'ins', value: 0 });
                  oilFieldFound = true;
                }
              }
              // 費用の支払い
              toIsland.money -= this.cost;
              seaDrillingCount++;
            } else {
              changeMapData(toIsland, x, y, 'sea', { type: 'ins', value: 0 });
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
          result.push({ ...baseLog, secret_log: log, log: log });
        }
        break;
      }
    }
    // 油田チャレンジの結果
    if (seaDrillingCount > 0) {
      const seaDrillingLog = oilFieldFound
        ? '、油田が掘り当てられました。'
        : 'ましたが、油田は見つかりませんでした。';
      const drillingLog = `${toIsland.island_name}島(${x}, ${y})で${this.cost * seaDrillingCount}の予算をつぎ込んだ掘削が行われ${seaDrillingLog}`;
      result.push({ ...baseLog, secret_log: drillingLog, log: drillingLog });
    }

    return { nextPlan: this.immediate, log: result };
  },
};
export const immediateDrilling: planType = {
  type: 'immediate_drilling',
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
  changeData: function ({ x, y, turn, info, eventRate }: changeDataArgs) {
    const { times, toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const arrayNum = mapArrayConverter(x, y);
    // 島情報
    const island_info = toIsland.island_info[arrayNum];
    // 基本地形
    const baseLand = getMapDefine(island_info.type).baseLand;
    // ログ
    const log = logCommonDev(toIsland, this, x, y);
    const result = [{ ...baseLog, secret_log: log, log: log }];

    // 海を採掘した回数
    let seaDrillingCount = 0;
    // 油田が見つかったかどうか
    let oilFieldFound = false;
    for (let i = 0; i < times + 1; i++) {
      switch (baseLand) {
        case 'plains': {
          changeMapData(toIsland, x, y, 'shallows', { type: 'ins', value: 0 });
          // 費用の支払い
          toIsland.money -= this.cost;
          break;
        }
        case 'mountain': {
          changeMapData(toIsland, x, y, 'wasteland', { type: 'ins', value: 0 });
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
                changeMapData(toIsland, x, y, 'oil_field', { type: 'ins', value: 0 });
                oilFieldFound = true;
              }
            }
            // 費用の支払い
            toIsland.money -= this.cost;
            seaDrillingCount++;
          } else {
            changeMapData(toIsland, x, y, 'sea', { type: 'ins', value: 0 });
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
          result.push({ ...baseLog, secret_log: log, log: log });
        }
        break;
      }
    }
    // 油田チャレンジの結果
    if (seaDrillingCount > 0) {
      const seaDrillingLog = oilFieldFound
        ? '、油田が掘り当てられました。'
        : 'ましたが、油田は見つかりませんでした。';
      const drillingLog = `${toIsland.island_name}島(${x}, ${y})で${this.cost * seaDrillingCount}の予算をつぎ込んだ掘削が行われ${seaDrillingLog}`;
      result.push({ ...baseLog, secret_log: drillingLog, log: drillingLog });
    }

    return { nextPlan: this.immediate, log: result };
  },
};

export const logging: planType = {
  type: 'logging',
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
  changeData: function ({ x, y, turn, info }: changeDataArgs) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // 伐採の収入を得る
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    toIsland.money += mapInfo.landValue * META_DATA.FOREST_VALUE;
    // マップの変更
    changeMapData(toIsland, x, y, 'plains', { type: 'ins', value: 0 });
    // ログ出力
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const log = logCommonDev(toIsland, this, x, y);
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
export const immediateLogging: planType = {
  type: 'immediate_logging',
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
  changeData: function ({ x, y, turn, info }: changeDataArgs) {
    const { toIsland } = info;
    // 地形や費用が不適切なら中止
    const validConstAndLand = validCostAndLandType(toIsland, this, x, y, turn);
    if (validConstAndLand.nextPlan) return validConstAndLand;

    // 費用の支払い
    toIsland.money -= this.cost;
    // 伐採の収入を得る
    const mapInfo = toIsland.island_info[mapArrayConverter(x, y)];
    toIsland.money += mapInfo.landValue * META_DATA.FOREST_VALUE;
    // マップの変更
    changeMapData(toIsland, x, y, 'plains', { type: 'ins', value: 0 });
    // ログ出力
    const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
    const log = logCommonDev(toIsland, this, x, y);
    return { nextPlan: this.immediate, log: [{ ...baseLog, secret_log: log, log: log }] };
  },
};
