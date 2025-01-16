import { DbSchema } from '@/global/function/db';

export const turnStateSchema: DbSchema = [
  {
    name: 'turn',
    type: 'INTEGER',
    defVal: '0',
  },
  {
    name: 'turn_processing',
    type: 'INTEGER',
    defVal: '0',
  },
];

export type turnStateSchemaType = {
  turn: number;
  turn_state: 0 | 1;
};
