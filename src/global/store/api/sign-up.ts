/**
 * @module sign-up
 * @description サインアップAPIのFetchStore定義。
 */
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/sign-up');

export const signUpStore = store.store;
