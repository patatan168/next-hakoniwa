/**
 * @module turnLog
 * @description 公開ターンログ取得用のFetchStore定義。
 */
import { TurnLog } from '@/db/kysely';
import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from '../public/turn';

const store = new FetchStore<Omit<TurnLog, 'secret_log'>[]>('/api/public/turn-log', {
  waitTime: 10,
  mergeData: {
    get: true,
    post: false,
    put: false,
    delete: false,
    head: false,
    patch: false,
    options: false,
  },
  dependsOn: [turnStore],
});

export const turnLogStore = store.store;
