import { isEqual, merge } from 'es-toolkit';
import { createStore, StoreApi } from 'zustand/vanilla';
import { getCookie } from '../cookie';
import { CSRF_COOKIE_NAME } from '../csrf';

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
  /**
   * 指定した他のZustandストアが更新された際に、自動的にfetch(GET)をトリガーする
   * @example dependsOn: [turnStore]
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependsOn?: StoreApi<any>[];
};

type DataOptions = {
  /** URLスキーム&ホスト */
  urlOrigin?: string;
  /** クエリパラメータ */
  query?: string;
  /** データを再取得するか */
  refresh?: boolean;
};

export type Rfc9457 = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
};

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
 * 内部エラーをRfc9457形式で取得する
 * @param error エラーオブジェクト
 * @param url エンドポイントURL
 * @param query クエリパラメータ
 * @returns Rfc9457形式のエラーオブジェクト
 */
function getInternalError(error: unknown, url: string, query?: string): Rfc9457 {
  return {
    type: url,
    title: 'Internal Server Error',
    status: 500,
    detail: error instanceof Error ? error.message : String(error),
    instance: query,
  };
}

/**
 * APIメソッドのデフォルト値を作成する
 * @param value デフォルト値
 * @returns 各APIメソッドに対して同じデフォルト値を持つオブジェクト
 */
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

/**
 * データをマージして取得する
 * @param current 現在のデータ
 * @param next 次のデータ
 * @param refresh リフレッシュフラグ
 * @param shouldMerge マージフラグ
 * @returns マージ後のデータ
 */
function resolveStoreData<T>(current: T, next: T, refresh: boolean, shouldMerge: boolean): T {
  if (refresh || !shouldMerge) return next;
  // Array or Object
  if (typeof current !== 'object' || typeof next !== 'object') return next;
  // 一致するなら現在値のまま
  if (isEqual(current, next)) return current;

  if (Array.isArray(current) && Array.isArray(next)) {
    return merge(current, next) as T;
  }
  if (!Array.isArray(current) && !Array.isArray(next)) {
    return { ...current, ...next } as T;
  }

  throw new Error('型が一致していません');
}

export type FetchState<T, U> = {
  data: ApiMethodType<T | undefined, U | undefined>;
  error: ApiMethodType<Rfc9457 | undefined>;
  isLoading: ApiMethodType<boolean>;
  fetchedAt: ApiMethodType<number>;
  pollingIntervalId: NodeJS.Timeout | null;
  /**
   * APIからデータを取得する
   * @param options Fetchのオプション
   * @param dataOptions 追加のデータオプション
   * @returns データの取得が成功した場合はvoid、失敗した場合はエラーをスロー
   */
  fetch: (options: RequestInit, addOptions?: DataOptions, waitTime?: number) => Promise<void>;
  /**
   * 必要に応じてAPIからデータを取得する
   * @param options Fetchのオプション
   * @param dataOptions 追加のデータオプション
   * @returns データの取得が成功した場合はvoid、失敗した場合はエラーをスロー
   */
  fetchIfNeeded: (options: RequestInit, addOptions?: DataOptions) => Promise<void>;
  /**
   * 指定した間隔でAPIからデータを取得するポーリングを開始する
   * @param interval ポーリングの間隔（ミリ秒）
   * @param query クエリパラメータ
   */
  startPolling: (interval?: number, query?: string) => void;
  /**
   * ポーリングを停止する
   */
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
export class FetchStore<T extends object | undefined, U = { result: boolean }> {
  public readonly store: StoreApi<FetchState<T, U>>;

  constructor(
    public readonly url: string,
    public readonly customOptions?: CustomOptions
  ) {
    const mergeData = customOptions?.mergeData ?? createApiMethodDefaults(false);
    const refreshGet = customOptions?.refreshGet ?? false;
    const waitTime = customOptions?.waitTime ?? 200;
    const dependsOn = customOptions?.dependsOn ?? [];

    this.store = createStore<FetchState<T, U>>((set, get) => ({
      data: createApiMethodDefaults(undefined),
      error: createApiMethodDefaults(undefined),
      isLoading: createApiMethodDefaults(false),
      fetchedAt: createApiMethodDefaults(0),
      pollingIntervalId: null,
      fetch: async (options, dataOptions) => {
        const method = (options.method?.toLowerCase() || 'get') as keyof ApiMethodType<T>;
        const state = get();

        // 既にローディング中の場合は何もしない
        if (state.isLoading[method]) return;

        const now = Date.now();
        const isWaitTime = now - state.fetchedAt[method] < waitTime;
        const isLastGetSucceed = method === 'get' && state.error.get !== undefined;
        // NOTE: 前回の取得が成功しており、waitTime以内の場合は何もしない
        if (isLastGetSucceed && isWaitTime) return;

        const { urlOrigin = '', query, refresh = false } = dataOptions || {};
        const urlWithQuery = query ? `${urlOrigin}${url}?${query}` : `${urlOrigin}${url}`;
        // ローディング開始
        set((prev) => ({
          isLoading: { ...prev.isLoading, [method]: true },
          error: { ...prev.error, [method]: undefined },
          fetchedAt: { ...prev.fetchedAt, [method]: now },
        }));
        // API呼び出し
        try {
          const fetched = await fetcher<T | U>(urlWithQuery, options);
          const merged = resolveStoreData(state.data[method], fetched, refresh, mergeData[method]);
          set((prev) => ({
            data: { ...prev.data, [method]: merged },
            isLoading: { ...prev.isLoading, [method]: false },
          }));
          // エラーをクリア
          set((prev) => ({
            error: { ...prev.error, [method]: undefined },
          }));
          // GET以外のメソッドの場合、必要に応じてGETを再取得
          if (refreshGet && method !== 'get') {
            await this.refreshFetch(urlWithQuery);
          }
        } catch (err) {
          if (err instanceof ApiError) {
            const rfc9457: Rfc9457 = {
              type: url,
              title: err.statusText,
              status: err.status,
              detail: err.message,
              instance: query,
            };
            set((prev) => ({
              error: { ...prev.error, [method]: rfc9457 },
              isLoading: { ...prev.isLoading, [method]: false },
            }));
          } else {
            const internalError = getInternalError(err, url, query);
            set((prev) => ({
              error: { ...prev.error, [method]: internalError },
              isLoading: { ...prev.isLoading, [method]: false },
            }));
          }
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

        // 初回取得
        state.fetch({ method: 'GET' }, { query, refresh: true });
        // ポーリング開始
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

    // 依存するストアが更新された際に自動的にfetch(GET)を行う
    if (dependsOn.length > 0) {
      dependsOn.forEach((dependencyStore) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dependencyStore.subscribe((newVal: any, oldVal: any) => {
          // data.get の値が実際に変化した場合のみfetchをトリガーする
          // (isLoadingやfetchedAtなど、他のプロパティの変化は無視する)
          if (!isEqual(newVal?.data?.get, oldVal?.data?.get)) {
            // 自動フェッチ時はrefreshフラグを立てて強制的にマージ/更新させる
            this.store.getState().fetch({ method: 'GET' }, { refresh: true });
          }
        });
      });
    }
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
      // エラーをクリア
      set((prev) => ({
        error: { ...prev.error, get: undefined },
      }));
    } catch (err) {
      if (err instanceof ApiError) {
        const rfc9457: Rfc9457 = {
          type: url,
          title: err.statusText,
          status: err.status,
          detail: err.message,
        };
        set((prev) => ({
          error: { ...prev.error, get: rfc9457 },
          isLoading: { ...prev.isLoading, get: false },
        }));
      } else {
        const internalError = getInternalError(err, url);
        set((prev) => ({
          error: { ...prev.error, get: internalError },
          isLoading: { ...prev.isLoading, get: false },
        }));
      }
    }
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
  const options = init || {};
  const csrfToken = getCookie(CSRF_COOKIE_NAME);
  if (csrfToken) {
    options.headers = { ...options.headers, 'x-csrf-token': csrfToken };
  }
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
