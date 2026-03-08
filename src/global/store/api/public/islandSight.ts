import { islandInfoTurnProgress, User } from '@/db/kysely';
import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from '../public/turn';

const store = new FetchStore<islandInfoTurnProgress & Pick<User, 'island_name'> & { rank: number }>(
  '/api/public/island-sight',
  { dependsOn: [turnStore] }
);

export const islandSightStore = store.store;
