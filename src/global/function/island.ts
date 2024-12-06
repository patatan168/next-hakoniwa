import { islandInfoData } from '@/db/schema/islandTable';
import { getMapDefine, sea } from '../define/mapType';
import META_DATA from '../define/metadata';

/**
 * 周囲のマップをカウントする
 * @param data マップデーター
 * @param countType カウントしたいマップタイプ
 * @param baseX 中心座標(X)
 * @param baseY 中心座標(Y)
 * @param hex 周囲のマス
 */
export const countAround = (
  data: islandInfoData,
  countType: string,
  baseX: number,
  baseY: number,
  hex: number
) => {
  let count = 0;
  for (let y = baseY - hex; y < baseY + hex + 1; y++) {
    for (let x = baseX - hex; x < baseX + hex + 1; x++) {
      const islandInfo = getIslandInfo(data, x, y, true);
      if (countType === islandInfo.type) count++;
    }
  }

  return count;
};

/**
 * 面積を数える
 * @param data マップデーター
 * @returns 面積(万坪)
 */
export const countArea = (data: islandInfoData) => {
  let count = 0;
  for (let y = 0; y < META_DATA.MapSize; y++) {
    for (let x = 0; x < META_DATA.MapSize; x++) {
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
  for (let y = 0; y < META_DATA.MapSize; y++) {
    for (let x = 0; x < META_DATA.MapSize; x++) {
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
 * 島情報を取得する
 * @param data マップデーター
 * @param findX 取得したい座標(X)
 * @param findY 取得したい座標(Y)
 * @param deep ディープコピーするか
 */
export const getIslandInfo = (data: islandInfoData, findX: number, findY: number, deep = false) => {
  if (findX >= 0 && findY > 0) {
    const arrayNum = findY * META_DATA.MapSize + findX;
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
