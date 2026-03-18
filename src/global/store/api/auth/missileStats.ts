/**
 * @module missileStats
 * @description ミサイル統計取得用のFetchStore定義。
 */
import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from '../public/turn';

export type MissileStatData = {
  monster_kill: number;
  city_kill: number;
  destroyed_maps: Array<{
    type: string;
    name: string;
    count: number;
  }>;
  killed_monsters: Array<{
    type: string;
    name: string;
    count: number;
  }>;
};

const store = new FetchStore<MissileStatData>('/api/auth/missile-stats', {
  dependsOn: [turnStore],
});

export const missileStatsStore = store.store;
