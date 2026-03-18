/**
 * @module plan
 * @description 計画データ取得用のFetchStore定義。
 */
import { Plan } from '@/db/kysely';
import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from '../public/turn';

const store = new FetchStore<Array<Plan>>('/api/auth/plan', {
  refreshGet: true,
  dependsOn: [turnStore],
});

export const planStore = store.store;
