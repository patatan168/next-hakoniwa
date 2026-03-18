/**
 * @module sign-out
 * @description サインアウトAPIのFetchStore定義。
 */
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/sign-out');

export const signOutStore = store.store;
