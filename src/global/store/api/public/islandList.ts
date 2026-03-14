import { FetchStore } from '@/global/function/fetch/fetch';

type PublicIslandListItem = {
  uuid: string;
  user_name: string;
  island_name: string;
  rank: number;
  population: number;
  money: number;
  food: number;
  area: number;
  farm: number;
  factory: number;
  mining: number;
};

const store = new FetchStore<Array<PublicIslandListItem>>('/api/public/island-list');

export const islandListStore = store.store;
