import { DbSchema } from '@/global/function/db';

export const turnLogSchema: DbSchema = [
  {
    name: 'log_uuid',
    type: 'string',
    primary: true,
    index: { query: ['DESC'] },
  },
  {
    name: 'from_uuid',
    type: 'TEXT',
    foreign: { table: 'user', name: 'uuid' },
  },
  {
    name: 'to_uuid',
    type: 'TEXT',
    nullable: true,
    foreign: { table: 'user', name: 'uuid' },
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
    nullable: true,
  },
];

export type turnLogSchemaType = {
  log_uuid: string;
  from_uuid: string;
  to_uuid: string | null;
  turn: number;
  secret_log: string;
  log: string | null;
};
