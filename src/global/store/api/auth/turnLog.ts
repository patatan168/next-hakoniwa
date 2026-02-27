import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { FetchStore } from '@/global/function/fetch/fetch';
import { turnStore } from '../public/turn';

const store = new FetchStore<Omit<turnLogSchemaType, 'log'>[]>('/api/auth/turn-log', {
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
  dependsOn: [turnStore],
});

export const turnLogAuthStore = store.store;
