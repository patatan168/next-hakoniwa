import { DbSchema } from '@/global/function/db';

export const userSchema: DbSchema = [
  { name: 'uuid', type: 'TEXT', primary: true, unique: true },
  { name: 'user_name', type: 'TEXT' },
  { name: 'island_name', type: 'TEXT' },
  { name: 'inhabited', type: 'INTEGER', defVal: '1' },
];

export type userSchemaType = {
  uuid: string;
  inhabited: 0 | 1;
  island_name: string;
  user_name: string;
};
