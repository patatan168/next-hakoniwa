/**
 * @module clientFetch
 * @description クライアントサイドのfetchフック。Zustandストアと連携してデータ取得を行う。
 */
import { useStore } from 'zustand';
import { StoreApi } from 'zustand/vanilla';
import { FetchState } from './fetch';

/**
 * FetchStoreをReactフックとして使用するラッパー。
 * @param store - ZustandのFetchStoreインスタンス
 * @returns データ・ローディング状態・エラー・fetch関連メソッド
 */
export function useClientFetch<T, U>(store: StoreApi<FetchState<T, U>>) {
  const data = useStore(store, (s) => s.data);
  const isLoading = useStore(store, (s) => s.isLoading);
  const error = useStore(store, (s) => s.error);
  const fetch = useStore(store, (s) => s.fetch);
  const fetchIfNeeded = useStore(store, (s) => s.fetchIfNeeded);
  const startPolling = useStore(store, (s) => s.startPolling);
  const stopPolling = useStore(store, (s) => s.stopPolling);

  return { data, isLoading, error, fetch, fetchIfNeeded, startPolling, stopPolling };
}
