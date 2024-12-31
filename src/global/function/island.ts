import { islandInfoData } from '@/db/schema/islandTable';
import { getMapDefine, sea } from '../define/mapType';
import META_DATA from '../define/metadata';

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
  if (findX >= 0 && findY > 0) {
    const arrayNum = mapArrayConverter(findX, findY);
    return deep ? structuredClone(data[arrayNum]) : data[arrayNum];
  } else {
    //外海
    return { x: findX, y: findY, type: sea.type, landValue: 0 };
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
