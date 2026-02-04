import { islandSchemaType } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<
  islandSchemaType & Pick<userSchemaType, 'island_name'> & { rank: number }
>('/api/public/island-sight');

export const islandSightStore = store.store;
