import { DbSchema } from '@/global/function/db';

export const islandSchema: DbSchema = [
  {
    name: 'uuid',
    type: 'TEXT',
    primary: true,
    unique: true,
    forign: { table: 'user', name: 'uuid' },
  },
  {
    name: 'island_name',
    type: 'TEXT',
    unique: true,
    forign: { table: 'user', name: 'island_name' },
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
    name: 'island_info',
    type: 'JSON',
  },
  {
    name: 'public_island_info',
    type: 'JSON',
  },
];

export type islandData = Array<islandSchemaType>;

export type islandSchemaType = {
  /** UUID */
  uuid: string;
  /** 島名 */
  island_name: string;
  /** 獲得賞 */
  prize: object;
  /** 資金 */
  money: number;
  /** 面積 */
  area: number;
  /** 人口 */
  pupulation: number;
  /** 農場規模 */
  farm: number;
  /** 工場規模 */
  factory: number;
  /** 採掘規模 */
  mining: number;
  /** 島情報 */
  island_info: islndInfo;
  /** 島情報 (公開:基地などは森に) */
  public_island_info: islndInfo;
};

export type islndInfo = {
  type: string;
  landValue: number;
  x: number;
  y: number;
};
