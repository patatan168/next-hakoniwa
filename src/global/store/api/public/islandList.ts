/**
 * @module islandList
 * @description 公開島一覧取得用のFetchStore定義。
 */
import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from './turn';

type PublicIslandListItem = {
  uuid: string;
  user_name: string;
  island_name_prefix: string;
  island_name: string;
  current_title_name: string;
  rank: number;
  population: number;
  money: number;
  food: number;
  area: number;
  farm: number;
  factory: number;
  mining: number;
};

const store = new FetchStore<Array<PublicIslandListItem>>('/api/public/island-list', {
  dependsOn: [turnStore],
});

export const islandListStore = store.store;
