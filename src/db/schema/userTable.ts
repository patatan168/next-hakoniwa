import { DbSchema } from '@/global/function/db';

export const userSchema: DbSchema = [
  { name: 'uuid', type: 'TEXT', primary: true, unique: true },
  { name: 'id', type: 'TEXT', unique: true },
  { name: 'password', type: 'TEXT' },
  { name: 'island_name', type: 'TEXT', unique: true },
  { name: 'created_at', type: 'DATETIME', defVal: 'CURRENT_TIMESTAMP' },
];
