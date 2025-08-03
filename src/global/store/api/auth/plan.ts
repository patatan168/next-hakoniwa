import { planSchemaType } from '@/db/schema/planTable';
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<Array<planSchemaType>>('/api/auth/plan');

export const planStore = store.store;
