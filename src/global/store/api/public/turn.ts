import { TurnState } from '@/db/kysely';
import { FetchStore } from '@/global/function/fetch/fetch';

export type TurnResponse = TurnState & { next_updated_at?: number };
const store = new FetchStore<TurnResponse>('/api/public/turn');

export const turnStore = store.store;
