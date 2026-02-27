import { planSchemaType } from '@/db/schema/planTable';
import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from '../public/turn';

const store = new FetchStore<Array<planSchemaType>>('/api/auth/plan', {
  refreshGet: true,
  dependsOn: [turnStore],
});

export const planStore = store.store;
