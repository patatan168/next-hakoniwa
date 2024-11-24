import { DbSchema } from '@/global/function/db';

export const sessionSchema: DbSchema = [
  {
    name: 'uuid',
    type: 'TEXT',
    primary: true,
    forign: { table: 'user', name: 'uuid' },
  },
  { name: 'session_id', type: 'INTEGER', unique: true },
  { name: 'public_key', type: 'TEXT', unique: true },
  { name: 'createdAt', type: 'DATETIME', defVal: 'CURRENT_TIMESTAMP' },
  { name: 'expires', type: 'DATETIME' },
];
