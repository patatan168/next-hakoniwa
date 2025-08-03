import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<{ uuid: string }>('/api/auth/session', { waitTime: 3000000 });

export const sessionStore = store.store;
