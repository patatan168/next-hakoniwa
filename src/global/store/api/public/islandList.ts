import { FetchStore } from '@/global/function/fetch';

const store = new FetchStore<Array<{ uuid: string; island_name: string }>>(
  '/api/public/island-list'
);

export const useFetchIslandList = () => store.use();
