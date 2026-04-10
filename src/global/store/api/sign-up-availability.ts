/**
 * @module sign-up-availability
 * @description サインアップ可否取得用のFetchStore定義。
 */
import { FetchStore } from '@/global/function/fetch/fetch';

export type SignUpAvailabilityResponse = {
  canSignUp: boolean;
  message?: string;
};

const store = new FetchStore<SignUpAvailabilityResponse>('/api/sign-up');

export const signUpAvailabilityStore = store.store;
