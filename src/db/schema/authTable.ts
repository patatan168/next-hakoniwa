import { DbSchema } from '@/global/function/db';

export const authSchema: DbSchema = [
  {
    name: 'uuid',
    type: 'TEXT',
    primary: true,
    unique: true,
    foreign: { table: 'user', name: 'uuid' },
  },
  { name: 'id', type: 'TEXT', unique: true },
  { name: 'password', type: 'TEXT' },
  // NOTE: アカウント作成日はセキュアでなくて良いため、ミリ秒ではなく秒で保存
  { name: 'created_at', type: 'INTEGER', defVal: 'unixepoch()' },
  { name: 'login_fail_count', type: 'INTEGER', defVal: '0' },
  { name: 'locked_until', type: 'DATETIME', defVal: 'NULL', nullable: true },
];

export type authSchemaType = {
  uuid: string;
  id: string;
  password: string;
  created_at: number;
  login_fail_count: number;
  locked_until: string | null;
};
