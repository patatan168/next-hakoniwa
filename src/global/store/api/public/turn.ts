import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { FetchStore } from '@/global/function/fetch';

const store = new FetchStore<turnLogSchemaType>('/api/public/turn');

export const useFetchTurn = () => store.use();
