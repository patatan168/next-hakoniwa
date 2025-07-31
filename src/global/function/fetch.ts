'use client';
import { create, StoreApi } from 'zustand';

type ApiMethodType<T, U = T> = Record<'get', T> &
  Record<'post' | 'put' | 'delete' | 'patch' | 'head' | 'options', U>;

/**
 * @brief FetchStoreのカスタムオプション
 * @property mergeData - 取得したデータを既存データとマージするか
 * @property refreshGet - GET以外のメソッドをfetchした際に、GETを再取得するか
 */
type CustomOptions = {
  /** 取得したデータを既存データとマージするか */
  mergeData?: ApiMethodType<boolean>;
  /** GET以外のメソッドをfetchした際に、GETを再取得するか */
  refreshGet?: boolean;
};

type DataOptions = {
  /** クエリパラメータ */
  query?: string;
  /** データを再取得するか */
  refresh?: boolean;
};

function createApiMethodDefaults<T>(value: T): ApiMethodType<T> {
  return {
    get: value,
    post: value,
    put: value,
    delete: value,
    patch: value,
    head: value,
    options: value,
  };
}

function resolveStoreData<T>(current: T, next: T, refresh: boolean, shouldMerge: boolean): T {
  if (refresh) return next;
  return shouldMerge ? { ...current, ...next } : next;
}

type FetchState<T, U> = {
  data: ApiMethodType<T | undefined, U | undefined>;
  error: ApiMethodType<ApiError | undefined>;
  isLoading: ApiMethodType<boolean>;
  fetchedAt: ApiMethodType<number>;
  pollingIntervalId: NodeJS.Timeout | null;
  fetch: (options: RequestInit, addOptions?: DataOptions, waitTime?: number) => Promise<void>;
  fetchIfNeeded: (options: RequestInit, addOptions?: DataOptions) => Promise<void>;
  startPolling: (interval?: number, query?: string) => void;
  stopPolling: () => void;
};

/**
 * @brief このストアは、APIからのデータ取得、エラーハンドリング、ローディング状態の管理を行う
 * @param url APIのエンドポイントURL
 * @param customOptions カスタムオプション
 * @template T APIから取得するデータの型
 * @template U GETメソッド以外のAPIから取得するデータの型
 * @example
 * const fetchStore = new FetchStore<MyDataType>('https://api.example.com/data');
 * const { data, error, loading, fetch } = fetchStore.use();
 * fetch({ method: 'GET' });
 * // データを取得し、data, error, loadingの状態を更新します
 * @remarks
 * このストアは、APIのメソッドごとにデータ、エラー、ローディング状態を管理します
 * 各メソッド（GET, POST, PUT, DELETEなど）に対して、データ、エラー、ローディング状態を保持します
 * また、データのマージや再取得のオプションを提供します
 */
export class FetchStore<T extends object, U = { result: boolean }> {
  public store = create<FetchState<T, U>>((set, get) => ({
    data: createApiMethodDefaults(undefined),
    error: createApiMethodDefaults(undefined),
    isLoading: createApiMethodDefaults(false),
    fetchedAt: createApiMethodDefaults(0),
    pollingIntervalId: null,
    fetch: async (options, dataOptions) => {
      const method = (options.method?.toLowerCase() || 'get') as keyof ApiMethodType<T>;
      const now = Date.now();
      const state = get();
      if (state.isLoading[method]) return;
      if (now - state.fetchedAt[method] < 200) return;

      const { query, refresh = false } = dataOptions || {};
      const { mergeData, refreshGet } = this.customOptions || {};
      const url = query ? `${this.url}?${query}` : this.url;
      const isMerge = mergeData?.[method] ?? false;

      set((prev) => ({
        isLoading: { ...prev.isLoading, [method]: true },
        error: { ...prev.error, [method]: undefined },
        fetchedAt: { ...prev.fetchedAt, [method]: now },
      }));

      try {
        const fetched = await fetcher<T | U>(url, options);
        const merged = resolveStoreData(state.data[method], fetched, refresh, isMerge);
        // データー反映
        set((prev) => ({
          data: { ...prev.data, [method]: merged },
          isLoading: { ...prev.isLoading, [method]: false },
        }));
        // リフレッシュ処理
        if (refreshGet && method !== 'get') {
          await this.refreshGet(set, url);
        }
      } catch (err) {
        set((prev) => ({
          error: { ...prev.error, [method]: err },
          isLoading: { ...prev.isLoading, [method]: false },
        }));
      }
    },
    fetchIfNeeded: async (options, dataOptions) => {
      const method = (options.method?.toLowerCase() || 'get') as keyof ApiMethodType<T>;
      const { data, fetch } = get();
      if (data[method] === undefined) {
        await fetch(options, dataOptions);
      }
    },
    startPolling: (interval = 5000, query?: string) => {
      const state = get();
      if (state.pollingIntervalId) return;
      let isRunning = false;

      const intervalId = setInterval(() => {
        if (isRunning) return;
        isRunning = true;

        state.fetch({ method: 'GET' }, { query, refresh: true }).finally(() => {
          isRunning = false;
        });
      }, interval);
      set({ pollingIntervalId: intervalId });
    },
    stopPolling: () => {
      const { pollingIntervalId } = get();
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        set({ pollingIntervalId: null });
      }
    },
  }));

  constructor(
    public url: string,
    public customOptions?: CustomOptions
  ) {}

  use() {
    return this.store();
  }

  private async refreshGet(set: StoreApi<FetchState<T, U>>['setState'], url: string) {
    const now = Date.now();
    try {
      set((prev) => ({
        isLoading: { ...prev.isLoading, get: true },
        error: { ...prev.error, get: undefined },
        fetchedAt: { ...prev.fetchedAt, get: now },
      }));

      const refreshed = await fetcher<T>(url, { method: 'GET' });
      set((prev) => ({
        data: { ...prev.data, get: refreshed },
        isLoading: { ...prev.isLoading, get: false },
      }));
    } catch (err) {
      set((prev) => ({
        error: { ...prev.error, get: err as ApiError },
        isLoading: { ...prev.isLoading, get: false },
      }));
    }
  }
}

class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcher = async <T = any>(input: RequestInfo | URL, init?: RequestInit) => {
  const url = input;
  const options = init;
  const responseData = async (res: Response) => {
    const data = (await res.json()) as T;
    if (!res.ok) {
      const errorMessage = (data as { error?: string }).error ?? '';
      const error = new ApiError(errorMessage, res.status, res.statusText);
      throw error;
    }
    return data;
  };
  const tmpMethod = options?.method ?? 'get';
  const retries = tmpMethod.toLowerCase() === 'get' ? 3 : 0;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      return responseData(res);
    } catch (err) {
      const error = err as ApiError;
      const isRetryStatus =
        error.status === 408 ||
        error.status === 429 ||
        error.status === 500 ||
        error.status === 502 ||
        error.status === 503 ||
        error.status === 504;
      if (isRetryStatus && attempt < retries) {
        if (attempt === retries) throw err;
        const delay = Math.pow(2, attempt) * 400;
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Unreachable');
};
