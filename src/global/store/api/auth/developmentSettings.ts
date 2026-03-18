/**
 * @module developmentSettings
 * @description 開発設定更新APIのFetchStore定義。
 */
import { FetchStore } from '@/global/function/fetch/fetch';

const store = new FetchStore<undefined>('/api/auth/development/settings');

export const developmentSettingsStore = store.store;
