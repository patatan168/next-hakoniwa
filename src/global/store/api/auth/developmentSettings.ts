import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/auth/development/settings');

export const developmentSettingsStore = store.store;
