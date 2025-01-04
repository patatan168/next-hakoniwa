import { DbSchema } from '@/global/function/db';

export const turnLogSchema: DbSchema = [
  {
    name: 'from_uuid',
    type: 'TEXT',
    primary: true,
    foreign: { table: 'user', name: 'uuid' },
  },
  {
    name: 'to_uuid',
    type: 'TEXT',
  },
  {
    name: 'turn',
    type: 'INTEGER',
  },
  {
    name: 'secret_log',
    type: 'TEXT',
  },
  {
    name: 'log',
    type: 'TEXT',
  },
];

export type turnLogSchemaType = {
  from_uuid: string;
  to_uuid: string;
  turn: number;
  secret_log: string;
  log: string;
};
