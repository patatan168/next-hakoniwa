'use client';
import { create } from 'zustand';

type ApiMethodType<T, U = T> = {
  get: T;
  post: U;
  put: U;
  delete: U;
  patch: U;
  head: U;
  options: U;
};

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

type FetchState<T, U> = {
  data: ApiMethodType<T | undefined, U | undefined>;
  error: ApiMethodType<ApiError | undefined>;
  isLoading: ApiMethodType<boolean>;
  fetchedAt: ApiMethodType<number>;
  fetch: (options: RequestInit, addOptions?: DataOptions) => Promise<void>;
  fetchIfNeeded: (options: RequestInit, addOptions?: DataOptions) => Promise<void>;
};

function getStoreData<T>(storeData: T, fetchData: T, refresh: boolean, isMergeData: boolean) {
  if (refresh) {
    return fetchData;
  } else if (isMergeData) {
    return { ...storeData, ...fetchData };
  } else {
    return fetchData;
  }
}

function createDefaultApiMethod<T>(defaultValue: T): ApiMethodType<T> {
  return {
    get: defaultValue,
    post: defaultValue,
    put: defaultValue,
    delete: defaultValue,
    patch: defaultValue,
    head: defaultValue,
    options: defaultValue,
  };
}

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
  private store = create<FetchState<T, U>>((set, get) => ({
    data: createDefaultApiMethod(undefined),
    error: createDefaultApiMethod(undefined),
    isLoading: createDefaultApiMethod(false),
    fetchedAt: createDefaultApiMethod(0),
    fetch: async (options: RequestInit, dataOptions?: DataOptions) => {
      const { isLoading, error, data, fetchedAt, fetch } = get();
      const { method } = options;
      const { mergeData, refreshGet } = this.customOptions || {};
      const { query, refresh = false } = dataOptions || {};
      const lowerMethod = method ? (method.toLowerCase() as keyof ApiMethodType<T>) : 'get';
      const now = Date.now();

      if (isLoading[lowerMethod]) return; // 既にロード中の場合は何もしない
      if (now - fetchedAt[lowerMethod] < 200 || refresh) return;

      set({
        isLoading: { ...isLoading, [lowerMethod]: true },
        error: { ...error, [lowerMethod]: undefined },
        fetchedAt: { ...fetchedAt, [lowerMethod]: now },
      });
      try {
        const url = query ? `${this.url}?${query}` : this.url;
        const fetchData =
          lowerMethod !== 'get' ? await fetcher<T>(url, options) : await fetcher<U>(url, options);
        const isMergeData = mergeData?.[lowerMethod] ?? false;
        const setData = getStoreData(data[lowerMethod], fetchData, refresh, isMergeData);

        set({
          data: { ...data, [lowerMethod]: setData },
          isLoading: { ...isLoading, [lowerMethod]: false },
        });
        if (refreshGet && lowerMethod !== 'get') {
          await fetch({ method: 'GET' }, { refresh: true });
        }
      } catch (err) {
        set({
          error: { ...error, [lowerMethod]: err },
          isLoading: { ...isLoading, [lowerMethod]: false },
        });
      }
    },
    fetchIfNeeded: async (options: RequestInit, dataOptions?: DataOptions) => {
      const { data, fetch } = get();
      const { method } = options;
      const lowerMethod = method ? (method.toLowerCase() as keyof ApiMethodType<T>) : 'get';
      if (data[lowerMethod] === undefined) {
        await fetch(options, dataOptions);
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
