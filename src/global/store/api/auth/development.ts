import { islandSchemaType } from '@/db/schema/islandTable';
import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from '../public/turn';

const store = new FetchStore<islandSchemaType & { island_name: string } & { rank: number }>(
  '/api/auth/development',
  { dependsOn: [turnStore] }
);

export const developmentStore = store.store;
