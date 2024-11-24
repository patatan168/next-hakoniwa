import { DbSchema } from '@/global/function/db';

export const userSchema: DbSchema = [
  { name: 'uuid', type: 'TEXT', primary: true, unique: true },
  { name: 'id', type: 'TEXT', unique: true },
  { name: 'password', type: 'TEXT' },
  { name: 'islandName', type: 'TEXT', unique: true },
  { name: 'createdAt', type: 'DATETIME', defVal: 'CURRENT_TIMESTAMP' },
];
