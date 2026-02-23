import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/auth/account/delete');

export const deleteAccountStore = store.store;
