import { islandInfoData, islandSchemaType } from '@/db/schema/islandTable';
import { difference } from 'es-toolkit/array';
import {
  logDamageWaste,
  logMonsterSubmersion,
  logScatterMonster,
  logSubmersion,
} from '../define/logType';
import { sea } from '../define/mapCategory/mapLand';
import { getMapDefine } from '../define/mapType';
import META_DATA from '../define/metadata';

/**
 * 外海かどうか
 * @param x X座標
 * @param y Y座標
 * @returns 外海かどうか
 */
export const isOpenSea = (x: number, y: number) => {
  const bellowMap = x < 0 || y < 0;
  const aboveMap = x >= META_DATA.MAP_SIZE || y >= META_DATA.MAP_SIZE;
  return bellowMap || aboveMap;
};

/**
 * 周囲のマップの座標を取得する
 * @param baseX 中心座標(X)
 * @param baseY 中心座標(Y)
 * @param hex 周囲のマス
 * @returns 周囲のマスの座標
 */
export const getMapAround = (baseX: number, baseY: number, hex: number) => {
  const result = [];
  for (let y = baseY - hex; y < baseY + hex + 1; y++) {
    // 中心座標からの距離
    const distance = Math.abs(baseY - y);
    // NOTE: 起点のY座標が奇数・偶数でX座標のオフセットが変わる
    const offsetX = baseY % 2 === 0 ? Math.ceil(distance / 2) : Math.trunc(distance / 2);

    // カウントを開始するX座標
    const startX = baseX - hex + offsetX;
    // カウントを終了するX座標
    // NOTE: 中心座標からの距離分、マスが減る
    const endX = startX + 2 * hex - distance;

    for (let x = startX; x < endX + 1; x++) {
      result.push({ x, y });
    }
  }

  return result;
};

/**
 * 周囲のマップをカウントする
 * @param data マップデーター
 * @param countType カウントしたいマップタイプ
 * @param baseX 中心座標(X)
 * @param baseY 中心座標(Y)
 * @param hex 周囲のマス
 * @returns カウント数
 */
export const countMapAround = (
  data: islandInfoData,
  countType: string,
  baseX: number,
  baseY: number,
  hex: number
) => {
  let count = 0;
  const around = getMapAround(baseX, baseY, hex);
  around.forEach(({ x, y }) => {
    const islandInfo = getIslandInfo(data, x, y, true);
    if (countType === islandInfo.type) count++;
  });

  return count;
};

/**
 * 面積を数える
 * @param data マップデーター
 * @returns 面積(万坪)
 */
export const countArea = (data: islandInfoData) => {
  let count = 0;
  for (let y = 0; y < META_DATA.MAP_SIZE; y++) {
    for (let x = 0; x < META_DATA.MAP_SIZE; x++) {
      const islandInfo = getIslandInfo(data, x, y, true);
      const { baseLand } = getMapDefine(islandInfo.type);
      switch (baseLand) {
        case 'plains':
        case 'mountain':
        case 'monster':
        case 'sanjira':
        case 'kujira':
          count++;
          break;
        default:
          break;
      }
    }
  }

  return 100 * count;
};

/**
 * マップ全体の特定のタイプの数値を算出
 * @note 小数がある場合は切り捨て
 * @param data マップデーター
 * @param type マップタイプ
 * @returns 係数 * 全体のlandValue
 */
export const calcAllTypeNum = (data: islandInfoData, type: string) => {
  let count = 0;
  for (let y = 0; y < META_DATA.MAP_SIZE; y++) {
    for (let x = 0; x < META_DATA.MAP_SIZE; x++) {
      const islandInfo = getIslandInfo(data, x, y, true);
      const { coefficient } = getMapDefine(islandInfo.type);
      switch (islandInfo.type) {
        case type:
          {
            const tmpCoefficient = coefficient !== undefined ? coefficient : 1;
            count = count + tmpCoefficient * islandInfo.landValue;
          }
          break;
        default:
          break;
      }
    }
  }

  return Math.trunc(count);
};

/**
 * 座標からマップの配列を変換する
 * @param x 取得したい座標(X)
 * @param y 取得したい座標(Y)
 * @return マップの配列番号
 */
export const mapArrayConverter = (x: number, y: number) => {
  return y * META_DATA.MAP_SIZE + x;
};

/**
 * 島情報を取得する
 * @param data マップデーター
 * @param findX 取得したい座標(X)
 * @param findY 取得したい座標(Y)
 * @param deep ディープコピーするか
 */
export const getIslandInfo = (data: islandInfoData, findX: number, findY: number, deep = false) => {
  if (isOpenSea(findX, findY)) {
    //外海
    return { x: findX, y: findY, type: sea.type, landValue: 0 };
  } else {
    const arrayNum = mapArrayConverter(findX, findY);
    return deep ? structuredClone(data[arrayNum]) : data[arrayNum];
  }
};

/**
 * 観光用のマップデータを取得
 * @param data マップデータ
 */
export const getPublicIslandInfo = (data: islandInfoData) => {
  return data.map((item) => {
    const fakeType = getMapDefine(item.type).fakeType;
    if (fakeType !== undefined) {
      return { x: item.x, y: item.y, type: fakeType, landValue: 0 };
    } else {
      return item;
    }
  });
};

/**
 * マップ情報を変更する
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @param mapType 変更するマップタイプ
 * @param landValue 変更するlandValue
 * @property landValue.type 変更タイプ (add, div, sub, multi, ins)
 * @property landValue.value 変更値
 */
export const changeMapData = (
  island: islandSchemaType,
  x: number,
  y: number,
  mapType: string,
  landValue: {
    /** 変更タイプ 現在値から(加算, 除算, 減算, 乗算, 挿入) */
    type: 'add' | 'sub' | 'multi' | 'div' | 'ins';
    /** 変更値 */
    value: number;
  }
) => {
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  // マップ変更
  if (mapInfo.type !== mapType) mapInfo.type = mapType;
  // LandValue変更
  switch (landValue.type) {
    case 'add':
      mapInfo.landValue += landValue.value;
      break;
    case 'sub':
      mapInfo.landValue -= landValue.value;
      break;
    case 'multi':
      mapInfo.landValue *= landValue.value;
      break;
    case 'div':
      mapInfo.landValue /= landValue.value;
      break;
    case 'ins':
      mapInfo.landValue = landValue.value;
      break;
  }
};

/**
 * 防衛施設の自爆処理
 * @param toIsland 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const defenseBaseCrash = (
  toIsland: islandSchemaType,
  x: number,
  y: number,
  turn: number
) => {
  const baseLog = { to_uuid: toIsland.uuid, from_uuid: toIsland.uuid, turn: turn };
  // 周囲1HEXのみ
  const aroundHex1 = difference(getMapAround(x, y, 1), [{ x, y }]);
  // 周囲2HEXのみ
  const aroundHex2 = difference(getMapAround(x, y, 2), [...aroundHex1, { x, y }]);

  // 中心座標は完全に水没
  const { defVal } = getMapDefine('sea');
  changeMapData(toIsland, x, y, 'sea', { type: 'ins', value: defVal });
  const tmpLog = logSubmersion(toIsland, x, y);
  const log = [{ ...baseLog, secret_log: tmpLog, log: tmpLog }];

  // 周囲1HEXは陸地破壊相当の処理 (NOTE: 山は消し飛ぶ)
  aroundHex1.forEach(({ x: changeX, y: changeY }) => {
    if (!isOpenSea(changeX, changeY)) {
      const mapInfo = toIsland.island_info[mapArrayConverter(changeX, changeY)];
      // 除外地形
      const excludeType = ['sea', 'shallows'];
      // マップの変更
      if (!excludeType.includes(mapInfo.type)) {
        const { defVal, baseLand } = getMapDefine('shallows');
        changeMapData(toIsland, changeX, changeY, 'shallows', { type: 'ins', value: defVal });
        // ログ出力
        const monsterType = ['monster', 'sanjira', 'kujira'];
        if (monsterType.includes(baseLand)) {
          const tmpLog = logMonsterSubmersion(toIsland, changeX, changeY);
          log.push({ ...baseLog, secret_log: tmpLog, log: tmpLog });
        } else {
          const tmpLog = logSubmersion(toIsland, changeX, changeY);
          log.push({ ...baseLog, secret_log: tmpLog, log: tmpLog });
        }
      }
    }
  });

  // 周囲2HEX
  aroundHex2.forEach(({ x: changeX, y: changeY }) => {
    if (!isOpenSea(changeX, changeY)) {
      const mapInfo = toIsland.island_info[mapArrayConverter(changeX, changeY)];
      // 除外地形
      const excludeType = [
        'sea',
        'shallows',
        'wasteland',
        'mountain',
        'mining',
        'submarine_missile',
        'oil_field',
      ];
      // マップの変更
      if (!excludeType.includes(mapInfo.type)) {
        const { defVal, baseLand } = getMapDefine('wasteland');
        changeMapData(toIsland, changeX, changeY, 'wasteland', { type: 'ins', value: defVal });
        const monsterType = ['monster', 'sanjira', 'kujira'];
        // ログ出力
        if (monsterType.includes(baseLand)) {
          const tmpLog = logScatterMonster(toIsland, changeX, changeY);
          log.push({ ...baseLog, secret_log: tmpLog, log: tmpLog });
        } else {
          const tmpLog = logDamageWaste(toIsland, changeX, changeY);
          log.push({ ...baseLog, secret_log: tmpLog, log: tmpLog });
        }
      }
    }
  });

  return log;
};
