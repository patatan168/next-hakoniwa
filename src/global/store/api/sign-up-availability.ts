/**
 * @module sign-up-availability
 * @description サインアップ可否取得用のFetchStore定義。
 */
import { FetchStore } from '@/global/function/fetch/fetch';

export type SignUpAvailabilityResponse = {
  canSignUp: boolean;
  message?: string;
};

/** サインアップ可否チェックのキャッシュTTL (ms) */
const SIGN_UP_AVAILABILITY_TTL_MS = 30 * 1000;

const store = new FetchStore<SignUpAvailabilityResponse>('/api/sign-up', {
  waitTime: SIGN_UP_AVAILABILITY_TTL_MS,
});

export const signUpAvailabilityStore = store.store;
