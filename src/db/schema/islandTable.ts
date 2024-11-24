import { DbSchema } from '@/global/function/db';

export const islandSchema: DbSchema = [
  {
    name: 'uuid',
    type: 'TEXT',
    primary: true,
    unique: true,
    forign: { table: 'user', name: 'uuid' },
  },
  {
    name: 'islandName',
    type: 'TEXT',
    unique: true,
    forign: { table: 'user', name: 'islandName' },
  },
  {
    name: 'population',
    type: 'INTEGER',
  },
  {
    name: 'farm',
    type: 'INTEGER',
  },
  {
    name: 'factory',
    type: 'INTEGER',
  },
  {
    name: 'mining',
    type: 'INTEGER',
  },
  {
    name: 'secret_island_info',
    type: 'JSON',
  },
  {
    name: 'island_info',
    type: 'JSON',
  },
];
