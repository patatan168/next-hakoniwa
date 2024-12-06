import { DbSchema } from '@/global/function/db';

export const sessionSchema: DbSchema = [
  {
    name: 'uuid',
    type: 'TEXT',
    primary: true,
    foreign: { table: 'user', name: 'uuid' },
  },
  { name: 'session_id', type: 'TEXT' },
  { name: 'public_key', type: 'TEXT', unique: true },
  { name: 'created_at', type: 'DATETIME', defVal: 'CURRENT_TIMESTAMP' },
  { name: 'expires', type: 'DATETIME' },
];

export type sessionSchemaType = {
  uuid: string;
  session_id: string;
  public_key: string;
  created_at: string;
  expires: string;
};
