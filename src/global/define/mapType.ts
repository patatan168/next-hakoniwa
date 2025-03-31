import * as mapFacility from './mapCategory/mapFacility';
import * as mapFake from './mapCategory/mapFake';
import * as mapLand from './mapCategory/mapLand';
import * as mapMilitary from './mapCategory/mapMilitary';
import * as mapMonster from './mapCategory/mapMonster';
import * as mapOther from './mapCategory/mapOther';

export type landType =
  | 'sea'
  | 'plains'
  | 'mountain'
  | 'submarine_missile'
  | 'oil_field'
  | 'monster'
  | 'sanjira'
  | 'kujira';

export type mapType = {
  /** タイプ */
  readonly type: string;
  /** 偽装タイプ */
  readonly fakeType?: string;
  /** 基本地形 */
  readonly baseLand: landType;
  /** 名称 name[lv] */
  readonly name: Array<string> | string;
  /** イメージデータのパス imgPath[lv] */
  readonly imgPath: Array<string> | string;
  /** 初期値 */
  readonly defVal: number;
  /** 最大値 */
  readonly maxVal: number;
  /** 倍率 */
  readonly coefficient?: number;
  /** レベル定義 [lv1の経験値,...,LvMaxの経験値] */
  readonly level?: Array<number>;
  /** 単位 */
  readonly unit?: string;
  /** 単位表示 (前後) */
  readonly unitType?: 'before' | 'after';
  /** レベル表示 */
  readonly showLevel?: boolean;
  /** Exp (怪獣用) */
  readonly exp?: number;
  /** 報奨金 (怪獣用) */
  readonly bounty?: number;
};

/** 全マップ情報 */
const MapInfo: Array<mapType> = Object.entries({
  ...mapFacility,
  ...mapFake,
  ...mapLand,
  ...mapMilitary,
  ...mapMonster,
  ...mapOther,
}).map(([key, value]) => ({ ...value }));

/**
 * マップ定義を取得
 * @param type マップのタイプ
 * @returns マップ定義
 */
export const getMapDefine = (type: string): mapType => {
  const map = MapInfo.find((map) => map.type === type);

  if (!map) {
    console.error(`${type} undefined`);
    return mapFake.dummy;
  }

  return map;
};

/**
 * マップレベルを取得
 * @param typeOrLevel マップのタイプ or マップのレベル定義
 * @param landVal 土地の値
 * @returns マップレベル
 */
export const getMapLevel = (typeOrLevel: string | Array<number>, landVal: number): number => {
  let level: Array<number> | undefined;
  /* 引数の判定 */
  if (typeof typeOrLevel === 'string') {
    level = getMapDefine(typeOrLevel).level;
  } else {
    level = typeOrLevel;
  }

  if (level !== undefined) {
    /* 降順に並び替える */
    const desOrderLevel = level.toSorted((before, after) => after - before);
    let mapLevel = 0;
    for (const [index, levelNum] of desOrderLevel.entries()) {
      if (landVal >= levelNum) {
        mapLevel = desOrderLevel.length - index;
        break;
      }
    }
    return mapLevel;
  }

  return 0;
};

export const getMapName = (type: string, landValue: number, name: string | string[]) => {
  if (typeof name !== 'string') {
    const levelNum = getMapLevel(type, landValue);
    return name[levelNum - 1];
  } else {
    return name;
  }
};

export const getMapImpPath = (type: string, landValue: number, imgPath: string | string[]) => {
  if (typeof imgPath !== 'string') {
    const levelNum = getMapLevel(type, landValue);
    return imgPath[levelNum - 1];
  } else {
    return imgPath;
  }
};

export const getMapInfoText = (x: number, y: number, type: string, landValue: number) => {
  const { name, coefficient, unit, unitType, showLevel } = getMapDefine(type);
  const mapName = getMapName(type, landValue, name);
  const mapCoefficient = coefficient !== undefined ? coefficient : 1;
  const mapLandValue = mapCoefficient * landValue;

  if (showLevel) {
    const levelNum = getMapLevel(type, landValue);
    return `(${x},${y}) ${mapName}(レベル ${levelNum}/経験値 ${mapLandValue})`;
  }
  if (unit !== undefined) {
    if (unitType === 'after' || unitType === undefined) {
      return `(${x},${y}) ${mapName}(${mapLandValue}${unit})`;
    } else {
      return `(${x},${y}) ${mapName}(${unit}${mapLandValue})`;
    }
  }

  return `(${x},${y}) ${mapName}`;
};
