import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/auth/sign-in');

export const signInStore = store.store;
