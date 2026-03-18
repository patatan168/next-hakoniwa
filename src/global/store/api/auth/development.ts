/**
 * @module development
 * @description 開発画面データ取得用のFetchStore定義。
 */
import { islandInfoTurnProgress } from '@/db/kysely';
import { FetchStore } from '@/global/function/fetch/fetch';
import { LoginBonusResult } from '@/global/function/loginBonus';
import { turnStore } from '../public/turn';

const store = new FetchStore<
  islandInfoTurnProgress & {
    island_name: string;
    island_name_prefix: string;
    user_name: string;
    island_name_changed_at: number;
    rank: number;
    current_title_type: string;
    current_title_name: string;
    available_titles: Array<{ type: string; name: string }>;
    can_change_island_name: boolean;
    next_island_name_change_at: number;
    loginBonus: LoginBonusResult | null;
  }
>('/api/auth/development', { dependsOn: [turnStore] });

export const developmentStore = store.store;
