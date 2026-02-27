import { turnStateSchemaType } from '@/db/schema/turnStateTable';
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<turnStateSchemaType>('/api/public/turn');

export const turnStore = store.store;
