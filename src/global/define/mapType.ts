import { eventRateSchemaType } from '@/db/schema/eventRateTable';
import { islandSchemaType } from '@/db/schema/islandTable';
import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { userSchemaType } from '@/db/schema/userTable';
import {
  changeMapData,
  countMapAround,
  getMapAround,
  mapArrayConverter,
  wideDamage,
} from '../function/island';
import { checkProbability, randomIntInRange } from '../function/utility';
import { logFire, logMonsterMove, logMonsterSuicideBombing } from './logType';
import * as mapFacility from './mapCategory/mapFacility';
import * as mapFake from './mapCategory/mapFake';
import * as mapLand from './mapCategory/mapLand';
import * as mapMilitary from './mapCategory/mapMilitary';
import * as mapMonster from './mapCategory/mapMonster';
import * as mapOther from './mapCategory/mapOther';

export type landType =
  | 'sea'
  | 'shallows'
  | 'plains'
  | 'mountain'
  | 'monument'
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
  /** 最小出現人口数 (人) */
  readonly minPopPopulation?: number;
  /** Exp (怪獣用) */
  readonly exp?: number;
  /** 報奨金 (怪獣用) */
  readonly bounty?: number;
  /** 最大移動距離 (Hex) */
  readonly maxMoveDistance?: number;
  /** マップ固有イベント */
  readonly event?: ({
    x,
    y,
    turn,
    fromIsland,
    eventRate,
  }: {
    x: number;
    y: number;
    turn: number;
    fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>;
    eventRate: eventRateSchemaType;
  }) => Array<turnLogSchemaType> | void | undefined;
};

/**
 * マップ定義を取得
 * @param type マップのタイプ
 * @returns マップ定義
 */
export const getMapDefine = (type: string): mapType => {
  // NOTE: 定義ファイルが増えたらObjectを追加すること
  const map = Object.entries({
    ...mapFacility,
    ...mapFake,
    ...mapLand,
    ...mapMilitary,
    ...mapMonster,
    ...mapOther,
  })
    .map(([_, value]) => ({ ...value }))
    .find((map) => map.type === type);

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

/**
 * 火事
 * @param x X座標
 * @param y Y座標
 * @param turn ターン数
 * @param fromIsland 実行する島データー
 * @param eventRate イベント確率
 * @returns 火事での焼失ログ or 何もなし
 */
export function fireDisaster(
  x: number,
  y: number,
  turn: number,
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  eventRate: eventRateSchemaType
): turnLogSchemaType | undefined {
  if (checkProbability(eventRate.fire)) {
    const forestNum = countMapAround(fromIsland.island_info, 'forest', x, y, 1);
    const monumentNum = countMapAround(fromIsland.island_info, 'monument', x, y, 1);
    if (forestNum === 0 && monumentNum === 0) {
      // 火事のログを作成
      const log = logFire(fromIsland, x, y);
      // 火災で焼失
      changeMapData(fromIsland, x, y, 'wasteland', { type: 'ins', value: 0 });
      return {
        from_uuid: fromIsland.uuid,
        to_uuid: fromIsland.uuid,
        turn: turn,
        log: log,
        secret_log: log,
      };
    }
  }
}

/**
 * 怪獣の移動
 * @param x X座標
 * @param y Y座標
 * @param turn ターン数
 * @param fromIsland 実行する島データー
 * @returns 移動ログ or undefined
 */
export function monsterMove(
  x: number,
  y: number,
  turn: number,
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>
): Array<turnLogSchemaType> | undefined {
  const mapInfo = fromIsland.island_info[mapArrayConverter(x, y)];

  // サンジラとクジラの硬化判定
  if (turn % 2 !== 0) {
    if (mapInfo.type === 'sanjira') return;
  } else {
    if (mapInfo.type === 'kujira') return;
  }

  // 最大移動距離の取得
  const maxMoveDistance = getMapDefine(mapInfo.type).maxMoveDistance ?? 1;

  // 怪獣の移動イベントが未実行なら実行
  if (mapInfo.monsterDistance === undefined || mapInfo.monsterDistance < maxMoveDistance) {
    // 移動カウント
    mapInfo.monsterDistance = mapInfo.monsterDistance !== undefined ? mapInfo.monsterDistance++ : 1;
    // 怪獣の移動範囲
    const movedArea = getMapAround(x, y, maxMoveDistance);
    // 移動試行数
    const moveChallenge = 3;
    // 移動先をランダムに決定
    let moveCoordinate: { x: number; y: number } | undefined = undefined;
    for (let i = 0; i < moveChallenge; i++) {
      // 移動先の座標をランダムに取得
      const randomIndex = randomIntInRange(0, movedArea.length - 1);
      const { x: moveX, y: moveY } = movedArea[randomIndex];
      // 移動先のマップ情報を取得
      const moveMapInfo = fromIsland.island_info[mapArrayConverter(moveX, moveY)];
      // 移動可能な地形かどうか
      if (getMapDefine(moveMapInfo.type).baseLand === 'plains') {
        moveCoordinate = { x: moveX, y: moveY };
        break;
      }
    }
    // 移動先が決まった場合
    if (moveCoordinate !== undefined) {
      const { x: moveX, y: moveY } = moveCoordinate;
      const moveMapInfo = fromIsland.island_info[mapArrayConverter(moveX, moveY)];
      let log: string;
      if (moveMapInfo.type === 'defense_base') {
        log = logMonsterSuicideBombing(fromIsland, x, y, moveX, moveY);
        const wideDamageLog = wideDamage(fromIsland, moveX, moveY, turn);
        return [
          {
            from_uuid: fromIsland.uuid,
            to_uuid: fromIsland.uuid,
            turn: turn,
            log: log,
            secret_log: log,
          },
          ...wideDamageLog,
        ];
      } else {
        log = logMonsterMove(fromIsland, x, y, moveX, moveY);
        // 移動先のマップ情報を変更
        changeMapData(fromIsland, moveX, moveY, mapInfo.type, {
          type: 'ins',
          value: mapInfo.landValue,
        });
        // 元のマップを荒地に変更
        changeMapData(fromIsland, x, y, 'wasteland', { type: 'ins', value: 0 });
        return [
          {
            from_uuid: fromIsland.uuid,
            to_uuid: fromIsland.uuid,
            turn: turn,
            log: log,
            secret_log: log,
          },
        ];
      }
    }
  }
}
