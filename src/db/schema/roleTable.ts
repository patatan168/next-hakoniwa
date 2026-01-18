import { DbSchema } from '@/global/function/db';

export const roleSchema: DbSchema = [
  {
    name: 'uuid',
    type: 'TEXT',
    primary: true,
    unique: true,
    foreign: { table: 'user', name: 'uuid' },
  },
  { name: 'role', type: 'INTEGER', defVal: '0' },
];

export const roleEnum = {
  USER: 0,
  ADMIN: 1,
} as const;

export type roleEnumType = (typeof roleEnum)[keyof typeof roleEnum];

export type roleSchemaType = {
  uuid: string;
  role: roleEnumType;
};
