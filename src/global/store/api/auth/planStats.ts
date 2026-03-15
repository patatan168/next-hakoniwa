import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from '../public/turn';

export type PlanStatItem = {
  plan: string;
  name: string;
  count: number;
};

const store = new FetchStore<PlanStatItem[]>('/api/auth/plan-stats', {
  dependsOn: [turnStore],
});

export const planStatsStore = store.store;
