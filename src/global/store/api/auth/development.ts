import { islandSchemaType } from '@/db/schema/islandTable';
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<islandSchemaType & { island_name: string } & { rank: number }>(
  '/api/auth/development'
);

export const developmentStore = store.store;
