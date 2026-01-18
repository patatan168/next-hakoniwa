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
];

export type lastLoginSchemaType = {
  uuid: string;
  last_login_at: number;
};
