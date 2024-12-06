/* eslint-disable complexity */
export type mapType = {
  /** タイプ */
  readonly type: string;
  /** 偽装タイプ */
  readonly fakeType?: string;
  /** 基本地形 */
  readonly baseLand: 'sea' | 'plains' | 'mountain' | 'monster' | 'sanjira' | 'kujira';
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

/**
 * マップ定義を取得
 * @param type マップのタイプ
 * @returns マップ定義
 */
export const getMapDefine = (type: string): mapType => {
  switch (type) {
    case 'fake_forest':
      return fakeForest;
    // Facility
    case 'factory':
      return factory;
    case 'farm':
      return farm;
    case 'mining':
      return mining;
    // Land
    case 'forest':
      return forest;
    case 'mountain':
      return mountain;
    case 'plains':
      return plains;
    case 'ruins':
      return ruins;
    case 'sea':
      return sea;
    case 'shallows':
      return shallows;
    case 'wasteland':
      return wasteland;
    // Military
    case 'missile':
      return missile;
    case 'submarine_missile':
      return submarineMissile;
    case 'defense_base':
      return defenseBase;
    // Monument
    case 'monument':
      return monument;
    // People
    case 'people':
      return people;
    // Monster
    case 'inora':
      return inora;
    case 'meka_inora':
      return mekaInora;
    case 'inora_ghost':
      return inoraGhost;
    case 'red_inora':
      return redInora;
    case 'dark_inora':
      return darkInora;
    case 'king_inora':
      return kingInora;
    case 'sanjira':
      return sanjira;
    case 'kujira':
      return kujira;
    default:
      console.error(`${type} undefined`);
      return dummy;
  }
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

export const dummy: mapType = {
  type: 'dummy',
  baseLand: 'sea',
  name: '',
  imgPath: '/img/land/sea.gif',
  defVal: 0,
  maxVal: 0,
};

// Fake(偽情報)
export const fakeForest: mapType = {
  type: 'fake_forest',
  baseLand: 'plains',
  name: '森',
  imgPath: '/img/land/forest.gif',
  defVal: 0,
  maxVal: 0,
};

// Facility(施設)
const facilityUnit = '人規模';
export const factory: mapType = {
  type: 'factory',
  baseLand: 'plains',
  name: '工場',
  imgPath: '/img/facility/factory.gif',
  defVal: 1,
  maxVal: 10,
  coefficient: 10000,
  unit: facilityUnit,
};
export const farm: mapType = {
  type: 'farm',
  baseLand: 'plains',
  name: '農場',
  imgPath: '/img/facility/farm.gif',
  defVal: 2,
  maxVal: 50,
  coefficient: 1000,
  unit: facilityUnit,
};
export const mining: mapType = {
  type: 'mining',
  baseLand: 'mountain',
  name: '採掘場',
  imgPath: '/img/facility/mining.gif',
  defVal: 5,
  maxVal: 200,
  coefficient: 100,
  unit: facilityUnit,
};

// Land
export const forest: mapType = {
  type: 'forest',
  fakeType: 'fake_forest',
  baseLand: 'plains',
  name: '森',
  imgPath: '/img/land/forest.gif',
  defVal: 5,
  maxVal: 200,
  coefficient: 100,
  unit: '本',
};
export const mountain: mapType = {
  type: 'mountain',
  baseLand: 'mountain',
  name: '山',
  imgPath: '/img/land/mountain.gif',
  defVal: 0,
  maxVal: 0,
};
export const plains: mapType = {
  type: 'plains',
  baseLand: 'plains',
  name: '平地',
  imgPath: '/img/land/plains.gif',
  defVal: 0,
  maxVal: 0,
};
export const ruins: mapType = {
  type: 'ruins',
  baseLand: 'plains',
  name: '荒地',
  imgPath: '/img/land/ruins.gif',
  defVal: 0,
  maxVal: 0,
};
export const sea: mapType = {
  type: 'sea',
  baseLand: 'sea',
  name: '海',
  imgPath: '/img/land/sea.gif',
  defVal: 0,
  maxVal: 0,
};
export const shallows: mapType = {
  type: 'shallows',
  baseLand: 'sea',
  name: '浅瀬',
  imgPath: '/img/land/shallows.gif',
  defVal: 0,
  maxVal: 0,
};
export const wasteland: mapType = {
  type: 'wasteland',
  baseLand: 'plains',
  name: '荒地',
  imgPath: '/img/land/wasteland.gif',
  defVal: 0,
  maxVal: 0,
};

// Military
export const missile: mapType = {
  type: 'missile',
  fakeType: 'fake_forest',
  baseLand: 'plains',
  name: 'ミサイル基地',
  imgPath: '/img/military/missile.gif',
  defVal: 0,
  maxVal: 200,
  level: [0, 20, 60, 120, 200],
  showLevel: true,
};
export const submarineMissile: mapType = {
  type: 'submarine_missile',
  fakeType: 'sea',
  baseLand: 'plains',
  name: '海底基地',
  imgPath: '/img/military/submarine_missile.gif',
  defVal: 0,
  maxVal: 200,
  level: [0, 50, 200],
  coefficient: 1,
  showLevel: true,
};
export const defenseBase: mapType = {
  type: 'defense_base',
  fakeType: 'fake_forest',
  baseLand: 'plains',
  name: '防衛基地',
  imgPath: '/img/military/defense_base.gif',
  defVal: 0,
  maxVal: 0,
};

// People
export const people: mapType = {
  type: 'people',
  baseLand: 'plains',
  name: ['村', '街', '都市'],
  imgPath: ['/img/people/village.gif', '/img/people/town.gif', '/img/people/city.gif'],
  defVal: 1,
  maxVal: 200,
  level: [1, 30, 100],
  coefficient: 100,
  unit: '人',
};

// Monument
export const monument: mapType = {
  type: 'monument',
  baseLand: 'plains',
  name: 'モノリス',
  imgPath: '/img/monument/monument0.gif',
  defVal: 0,
  maxVal: 0,
};

// Monster
export const inora: mapType = {
  type: 'inora',
  baseLand: 'monster',
  name: '怪獣いのら',
  imgPath: '/img/monster/inora.gif',
  defVal: 1,
  maxVal: 2,
  unit: '体力',
  unitType: 'before',
  exp: 5,
  bounty: 400,
};
export const mekaInora: mapType = {
  type: 'meka_inora',
  baseLand: 'monster',
  name: '怪獣メカいのら',
  imgPath: '/img/monster/meka_inora.gif',
  defVal: 2,
  maxVal: 2,
  unit: '体力',
  unitType: 'before',
  exp: 5,
  bounty: 0,
};
export const inoraGhost: mapType = {
  type: 'inora_ghost',
  baseLand: 'monster',
  name: '怪獣いのらゴースト',
  imgPath: '/img/monster/inora_ghost.gif',
  defVal: 1,
  maxVal: 1,
  unit: '体力',
  unitType: 'before',
  exp: 10,
  bounty: 300,
};
export const redInora: mapType = {
  type: 'red_inora',
  baseLand: 'monster',
  name: '怪獣レッドいのら',
  imgPath: '/img/monster/red_inora.gif',
  defVal: 3,
  maxVal: 4,
  unit: '体力',
  unitType: 'before',
  exp: 12,
  bounty: 1000,
};
export const darkInora: mapType = {
  type: 'dark_inora',
  baseLand: 'monster',
  name: '怪獣ダークいのら',
  imgPath: '/img/monster/dark_inora.gif',
  defVal: 2,
  maxVal: 3,
  unit: '体力',
  unitType: 'before',
  exp: 15,
  bounty: 800,
};
export const kingInora: mapType = {
  type: 'king_inora',
  baseLand: 'monster',
  name: '怪獣キングいのら',
  imgPath: '/img/monster/king_inora.gif',
  defVal: 5,
  maxVal: 6,
  unit: '体力',
  unitType: 'before',
  exp: 30,
  bounty: 2000,
};
export const sanjira: mapType = {
  type: 'sanjira',
  baseLand: 'sanjira',
  name: '怪獣サンジラ',
  imgPath: '/img/monster/sanjira.gif',
  defVal: 2,
  maxVal: 3,
  unit: '体力',
  unitType: 'before',
  exp: 7,
  bounty: 500,
};
export const kujira: mapType = {
  type: 'kujira',
  baseLand: 'kujira',
  name: '怪獣クジラ',
  imgPath: '/img/monster/kujira.gif',
  defVal: 4,
  maxVal: 5,
  unit: '体力',
  unitType: 'before',
  exp: 20,
  bounty: 1500,
};
