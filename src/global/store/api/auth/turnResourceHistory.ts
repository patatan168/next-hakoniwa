/**
 * @module turnResourceHistory
 * @description ターン資源履歴取得用のFetchStore定義。
 */
import { TurnResourceHistory } from '@/db/kysely';
import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from '../public/turn';

const store = new FetchStore<Omit<TurnResourceHistory, 'uuid'>[]>(
  '/api/auth/turn-resource-history',
  { dependsOn: [turnStore] }
);

export const turnResourceHistoryStore = store.store;
