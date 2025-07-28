import { userSchemaType } from '@/db/schema/userTable';
import { FetchStore } from '@/global/function/fetch';

const store = new FetchStore<Array<userSchemaType>>('/api/auth/user');

export const useFetchUser = () => store.use();
