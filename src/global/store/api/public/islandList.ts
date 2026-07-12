/**
 * @module islandList
 * @description 公開島一覧取得用のFetchStore定義。
 */
import { FetchStore } from '@/global/function/fetch/fetch';
import { deleteAccountStore } from '../account/delete';
import { changeAccountStore } from '../account/update';
import { signUpStore } from '../sign-up';
import { turnStore } from './turn';

type PublicIslandListItem = {
  uuid: string;
  user_name: string;
  island_name_prefix: string;
  island_name: string;
  current_title_name: string;
  rank: number;
  population: number;
  money: number;
  food: number;
  area: number;
  farm: number;
  factory: number;
  mining: number;
  last_login_at: number;
};

const store = new FetchStore<Array<PublicIslandListItem>>('/api/public/island-list', {
  dependsGetOn: [turnStore],
  dependsPostOn: [signUpStore],
  dependsPutOn: [changeAccountStore],
  dependsDeleteOn: [deleteAccountStore],
});

export const islandListStore = store.store;
