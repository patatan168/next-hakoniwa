import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/auth/account/update');

export const changeAccountStore = store.store;
