/**
 * @module update
 * @description アカウント更新APIのFetchStore定義。
 */
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/auth/account/update');

export const changeAccountStore = store.store;
