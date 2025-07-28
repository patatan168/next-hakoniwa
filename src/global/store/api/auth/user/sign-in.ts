import { userSchemaType } from '@/db/schema/userTable';
import { FetchStore } from '@/global/function/fetch';

const store = new FetchStore<Array<userSchemaType>>('/api/auth/user/sign-in');

export const useFetchUserSignIn = () => store.use();
