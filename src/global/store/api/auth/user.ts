import { User } from '@/db/kysely';
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<Array<User>>('/api/auth/user', { refreshGet: true });

export const userStore = store.store;
