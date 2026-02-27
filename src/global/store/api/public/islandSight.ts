import { islandSchemaType } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from '../public/turn';

const store = new FetchStore<
  islandSchemaType & Pick<userSchemaType, 'island_name'> & { rank: number }
>('/api/public/island-sight', { dependsOn: [turnStore] });

export const islandSightStore = store.store;
