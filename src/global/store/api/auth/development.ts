import { islandSchemaType } from '@/db/schema/islandTable';
import { FetchStore } from '@/global/function/fetch';

const store = new FetchStore<islandSchemaType>('/api/auth/development');

export const useFetchDevelopment = () => store.use();
