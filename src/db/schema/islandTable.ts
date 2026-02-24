import { DbSchema } from '@/global/function/db';
import { getPublicIslandInfo } from '@/global/function/island';
import { eventRateSchemaType } from './eventRateTable';
import { userSchemaType } from './userTable';

export const islandSchema: DbSchema = [
  {
    name: 'uuid',
    type: 'TEXT',
    primary: true,
    unique: true,
    foreign: { table: 'user', name: 'uuid' },
  },
  {
    name: 'prize',
    type: 'JSON',
  },
  {
    name: 'money',
    type: 'INTEGER',
  },
  {
    name: 'area',
    type: 'INTEGER',
  },
  {
    name: 'population',
    type: 'INTEGER',
    index: { query: ['DESC'] },
  },
  {
    name: 'food',
    type: 'INTEGER',
  },
  {
    name: 'farm',
    type: 'INTEGER',
  },
  {
    name: 'factory',
    type: 'INTEGER',
  },
  {
    name: 'mining',
    type: 'INTEGER',
  },
  {
    name: 'missile',
    type: 'INTEGER',
  },
  {
    name: 'island_info',
    type: 'JSON',
  },
];

export type islandData = Array<islandSchemaType>;

export type islandSchemaType = {
  /** UUID */
  uuid: string;
  /** 獲得賞 */
  prize: object;
  /** 資金 */
  money: number;
  /** 面積 */
  area: number;
  /** 人口 */
  population: number;
  /** 食糧 */
  food: number;
  /** 農場規模 */
  farm: number;
  /** 工場規模 */
  factory: number;
  /** 採掘規模 */
  mining: number;
  /** ミサイル保有数 */
  missile: number;
  /** 島情報 */
  island_info: islandInfoData;
};

export interface islandInfoTurnProgress
  extends islandSchemaType, Omit<eventRateSchemaType, 'uuid'>, Pick<userSchemaType, 'island_name'> {
  /** 人工怪獣出現数 */
  artificialMonster: number;
  /** モノリス落下数 */
  fallMonument: number;
}

/**
 * JSON ColumをObjectに変換
 * @param island islandテーブルのデーター
 * @param isPublic 公開データか
 */
export const parseJsonIslandData = <T extends islandSchemaType>(island: T, isPublic = true) => {
  if ('prize' in island && typeof island.prize === 'string') {
    island.prize = JSON.parse(island.prize);
  }
  if ('island_info' in island && typeof island.island_info === 'string') {
    island.island_info = isPublic
      ? getPublicIslandInfo(JSON.parse(island.island_info))
      : JSON.parse(island.island_info);
  }
  if (isPublic) {
    island.missile = 0;
    island.money = Math.round(island.money / 1000) * 1000;
  }
};

/**
 * JSON ColumをObjectに変換 (Turn進行用のkeyを初期化)
 * @param island islandテーブルのデーター
 * @param isPublic 公開データか
 */
export const parseJsonIslandDataTurnProgress = (
  island: islandInfoTurnProgress,
  isPublic = true
) => {
  parseJsonIslandData(island, isPublic);
  island.artificialMonster = 0;
  island.fallMonument = 0;
};

export type islandInfoData = Array<islandInfo>;

export type islandInfo = {
  type: string;
  landValue: number;
  x: number;
  y: number;
  /** 怪獣の移動距離 */
  monsterDistance?: number;
};
