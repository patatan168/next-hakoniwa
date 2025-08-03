import { userSchemaType } from '@/db/schema/userTable';
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<Array<userSchemaType>>('/api/auth/user', { refreshGet: true });

export const userStore = store.store;
