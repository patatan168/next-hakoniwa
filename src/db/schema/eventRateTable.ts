import META_DATA from '@/global/define/metadata';
import { DbSchema } from '@/global/function/db';

export const eventRateSchema: DbSchema = [
  {
    name: 'uuid',
    type: 'TEXT',
    primary: true,
    foreign: { table: 'user', name: 'uuid' },
  },
  {
    name: 'earthquake',
    type: 'REAL',
    defVal: `${META_DATA.EARTHQUAKE_RATE}`,
  },
  {
    name: 'tsunami',
    type: 'REAL',
    defVal: `${META_DATA.TSUNAMI_RATE}`,
  },
  {
    name: 'typhoon',
    type: 'REAL',
    defVal: `${META_DATA.TYPHOON_RATE}`,
  },
  {
    name: 'meteorite',
    type: 'REAL',
    defVal: `${META_DATA.METEORITE_RATE}`,
  },
  {
    name: 'huge_meteorite',
    type: 'REAL',
    defVal: `${META_DATA.HUGE_METEORITE_RATE}`,
  },
  {
    name: 'eruption',
    type: 'REAL',
    defVal: `${META_DATA.ERUPTION_RATE}`,
  },
  {
    name: 'fire',
    type: 'REAL',
    defVal: `${META_DATA.FIRE_RATE}`,
  },
  {
    name: 'buried_treasure',
    type: 'REAL',
    defVal: `${META_DATA.BURIED_TREASURE_RATE}`,
  },
  {
    name: 'oil_field',
    type: 'REAL',
    defVal: `${META_DATA.OIL_FIELD_RATE}`,
  },
  {
    name: 'oil_exhaustion',
    type: 'REAL',
    defVal: `${META_DATA.OIL_EXHAUSTION_RATE}`,
  },
  {
    name: 'fall_down',
    type: 'REAL',
    defVal: `${META_DATA.FALL_DOWN_RATE}`,
  },
  {
    name: 'monster',
    type: 'REAL',
    defVal: `${META_DATA.MONSTER_RATE}`,
  },
  {
    name: 'propaganda',
    type: 'INTEGER',
    defVal: '0',
  },
];

export type eventRateSchemaType = {
  uuid: string;
  earthquake: number;
  tsunami: number;
  typhoon: number;
  meteorite: number;
  huge_meteorite: number;
  eruption: number;
  fire: number;
  buried_treasure: number;
  oil_field: number;
  oil_exhaustion: number;
  fall_down: number;
  monster: number;
  propaganda: 0 | 100;
};
