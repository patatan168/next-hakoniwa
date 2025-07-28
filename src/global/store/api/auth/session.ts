import { FetchStore } from '@/global/function/fetch';

const store = new FetchStore<{ uuid: string }>('/api/auth/session');

export const useFetchSession = () => store.use();
