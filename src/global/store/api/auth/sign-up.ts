import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/auth/sign-up');

export const signUpStore = store.store;
