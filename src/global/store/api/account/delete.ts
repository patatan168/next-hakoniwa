/**
 * @module delete
 * @description アカウント削除APIのFetchStore定義。
 */
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/auth/account/delete');

export const deleteAccountStore = store.store;
