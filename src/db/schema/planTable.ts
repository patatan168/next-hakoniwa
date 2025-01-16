import { DbSchema } from '@/global/function/db';

export const planSchema: DbSchema = [
  {
    name: 'from_uuid',
    type: 'TEXT',
    primary: true,
    foreign: { table: 'user', name: 'uuid' },
  },
  {
    name: 'to_uuid',
    type: 'Text',
    foreign: { table: 'user', name: 'uuid' },
  },
  {
    name: 'plan_no',
    type: 'INTEGER',
  },
  {
    name: 'times',
    type: 'INTEGER',
  },
  {
    name: 'x',
    type: 'INTEGER',
  },
  {
    name: 'y',
    type: 'INTEGER',
  },
  {
    name: 'plan',
    type: 'Text',
  },
];

export type planSchemaType = {
  from_uuid: string;
  to_uuid: string;
  plan_no: number;
  times: number;
  x: number;
  y: number;
  plan: string;
};
