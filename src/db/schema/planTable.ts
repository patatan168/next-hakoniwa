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
    name: 'plan',
    type: 'Text',
  },
];
