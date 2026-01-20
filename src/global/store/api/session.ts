import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<{ uuid: string }>('/api/session', { waitTime: 300 });

export const sessionStore = store.store;
