import { useStore } from 'zustand';
import { StoreApi } from 'zustand/vanilla';
import { FetchState } from './fetch';

export function useClientFetch<T, U>(store: StoreApi<FetchState<T, U>>) {
  const data = useStore(store, (s) => s.data);
  const isLoading = useStore(store, (s) => s.isLoading);
  const error = useStore(store, (s) => s.error);
  const fetch = useStore(store, (s) => s.fetch);
  const fetchIfNeeded = useStore(store, (s) => s.fetchIfNeeded);

  return { data, isLoading, error, fetch, fetchIfNeeded };
}
