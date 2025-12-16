import { DbSchema } from '@/global/function/db';

export const userSchema: DbSchema = [
  { name: 'uuid', type: 'TEXT', primary: true, unique: true },
  { name: 'inhabited', type: 'INTEGER', defVal: '1' },
  { name: 'id', type: 'TEXT', unique: true },
  { name: 'password', type: 'TEXT' },
  { name: 'island_name', type: 'TEXT', unique: true },
  { name: 'created_at', type: 'DATETIME', defVal: 'CURRENT_TIMESTAMP' },
  { name: 'login_fail_count', type: 'INTEGER', defVal: '0' },
  { name: 'locked_until', type: 'DATETIME', defVal: 'NULL', nullable: true },
];

export type userSchemaType = {
  uuid: string;
  inhabited: 0 | 1;
  id: string;
  password: string;
  island_name: string;
  created_at: string;
  login_fail_count: number;
  locked_until: string | null;
};
