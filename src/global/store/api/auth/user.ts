import { userSchemaType } from '@/db/schema/userTable';
import { FetchStore } from '@/global/function/fetch';

const store = new FetchStore<Array<userSchemaType>>('/api/auth/user', { refreshGet: true });

export const useFetchUser = () => store.use();
