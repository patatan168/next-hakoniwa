import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/sign-in');

export const signInStore = store.store;
