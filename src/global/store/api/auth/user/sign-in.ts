import { userSchemaType } from '@/db/schema/userTable';
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<Array<userSchemaType>>('/api/auth/user/sign-in');

export const userSignInStore = store.store;
