import { islandInfoTurnProgress } from '@/db/kysely';
import { FetchStore } from '@/global/function/fetch/fetch';
import { LoginBonusResult } from '@/global/function/loginBonus';
import { turnStore } from '../public/turn';

const store = new FetchStore<
  islandInfoTurnProgress & {
    island_name: string;
    rank: number;
    loginBonus: LoginBonusResult | null;
  }
>('/api/auth/development', { dependsOn: [turnStore] });

export const developmentStore = store.store;
