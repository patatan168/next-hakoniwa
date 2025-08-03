import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<Array<{ uuid: string; island_name: string }>>(
  '/api/public/island-list'
);

export const islandListStore = store.store;
