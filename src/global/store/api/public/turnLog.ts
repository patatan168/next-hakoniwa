import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<turnLogSchemaType[]>('/api/public/turn-log', {
  waitTime: 10,
  mergeData: {
    get: true,
    post: false,
    put: false,
    delete: false,
    head: false,
    patch: false,
    options: false,
  },
});

export const turnLogStore = store.store;
