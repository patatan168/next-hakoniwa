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
  {
    name: 'last_updated_at',
    type: 'INTEGER',
    defVal: '0',
  },
];

export type turnStateSchemaType = {
  turn: number;
  turn_processing: 0 | 1;
  last_updated_at: number;
  next_updated_at?: number;
};
