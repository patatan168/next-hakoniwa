import { createStore, StoreApi } from 'zustand/vanilla';

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
  /** APIの連続呼び出しを防ぐための待機時間 (ms) */
  waitTime?: number;
};

type DataOptions = {
  /** URLスキーム&ホスト */
  urlOrigin?: string;
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

export type FetchState<T, U> = {
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
  public readonly store: StoreApi<FetchState<T, U>>;

  constructor(
    public readonly url: string,
    public readonly customOptions?: CustomOptions
  ) {
    const mergeData = customOptions?.mergeData ?? createApiMethodDefaults(false);
    const refreshGet = customOptions?.refreshGet ?? false;
    const waitTime = customOptions?.waitTime ?? 200;

    this.store = createStore<FetchState<T, U>>((set, get) => ({
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
        if (now - state.fetchedAt[method] < waitTime) return;

        const { urlOrigin = '', query, refresh = false } = dataOptions || {};
        const urlWithQuery = query ? `${urlOrigin}${url}?${query}` : `${urlOrigin}${url}`;

        set((prev) => ({
          isLoading: { ...prev.isLoading, [method]: true },
          error: { ...prev.error, [method]: undefined },
          fetchedAt: { ...prev.fetchedAt, [method]: now },
        }));

        try {
          const fetched = await fetcher<T | U>(urlWithQuery, options);
          const merged = resolveStoreData(state.data[method], fetched, refresh, mergeData[method]);
          set((prev) => ({
            data: { ...prev.data, [method]: merged },
            isLoading: { ...prev.isLoading, [method]: false },
          }));
          if (refreshGet && method !== 'get') {
            await this.refreshFetch(urlWithQuery);
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
  }

  private async refreshFetch(url: string) {
    const set = this.store.setState;
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

/**
 * リトライが必要なステータスかどうかを判定する
 * @param status ステータスコード
 * @return リトライが必要な場合は true、それ以外は false
 */
const isRetryStatus = (status: number) => {
  switch (status) {
    case 408: // リクエストタイムアウト
    case 429: // リクエスト過多
    case 500: // サーバーエラー
    case 502: // バッドゲートウェイ
    case 503: // サービス利用不可
    case 504: // ゲートウェイタイムアウト
      return true;
    default:
      return false;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcher = async <T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeOut: number = 5000
) => {
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

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeOut);
      const res = await fetch(url, { ...options, signal: controller.signal });
      const data = await responseData(res);
      return data;
    } catch (err) {
      lastError = err;
      const error = err as Error;
      const isApiError = error instanceof ApiError;
      const isRetry = (isApiError && isRetryStatus(error.status)) || error.name === 'AbortError';
      if (attempt === retries || !isRetry) {
        throw error;
      }
      const baseDelay = Math.pow(2, attempt) * 400;
      // NOTE: 一斉にリトライが走らないようにJitterを加える
      const jitter = Math.random() * 100;
      const delay = baseDelay + jitter;
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }
  // リトライ上限に達した場合は最後のエラーを投げる
  throw lastError ?? new Error('API fetch failed after retries');
};
