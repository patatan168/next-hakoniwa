import { DbSchema } from '@/global/function/db';

export const lastLoginSchema: DbSchema = [
  {
    name: 'uuid',
    type: 'TEXT',
    primary: true,
    unique: true,
    foreign: { table: 'user', name: 'uuid' },
  },
  // NOTE: 最終ログインはセキュアでなくて良いため、ミリ秒ではなく秒で保存
  { name: 'last_login_at', type: 'INTEGER', defVal: 'unixepoch()' },
  { name: 'last_bonus_received_at', type: 'INTEGER', defVal: '0' },
  { name: 'consecutive_login_days', type: 'INTEGER', defVal: '0' },
];

export type lastLoginSchemaType = {
  uuid: string;
  last_login_at: number;
  last_bonus_received_at: number;
  consecutive_login_days: number;
};
