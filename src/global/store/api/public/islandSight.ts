/**
 * @module islandSight
 * @description 島の詳細情報取得用のFetchStore定義。
 */
import { islandInfoTurnProgress, User } from '@/db/kysely';
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<
  islandInfoTurnProgress & Pick<User, 'island_name' | 'island_name_prefix'> & { rank: number }
>('/api/public/island-sight');

export const islandSightStore = store.store;
