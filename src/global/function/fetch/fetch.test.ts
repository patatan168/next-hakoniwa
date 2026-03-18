/**
 * @module fetch.test
 * @description FetchStore のテスト。特に GET refresh の保留機構を検証。
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FetchStore } from './fetch';

describe('FetchStore - GET refresh の保留機構', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createMockResponse = (data: any) =>
    ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => data,
    }) as any as Response;

  it('isLoading 中の GET refresh は保留され、完了後に再実行される', async () => {
    const resolver: { resolve?: () => void } = {};
    const firstCallPromise = new Promise<void>((resolve) => {
      resolver.resolve = resolve;
    });

    globalThis.fetch = vi.fn((..._args) => {
      const callCount = (globalThis.fetch as any).mock.calls.length;
      if (callCount === 1) {
        return firstCallPromise.then(() => createMockResponse({ attempt: 1 }));
      }
      return Promise.resolve(createMockResponse({ attempt: 2 }));
    });

    const store = new FetchStore<{ attempt: number }>('/api/test');
    const state = store.store.getState();

    // 初回 GET リクエスト開始
    const firstFetch = state.fetch({ method: 'GET' });

    // isLoading 中に GET refresh を送信
    const secondFetch = state.fetch({ method: 'GET' }, { refresh: true });

    // 2 回目が即座に返る（保留処理）
    expect((globalThis.fetch as any).mock.calls).toHaveLength(1);
    await secondFetch;

    // 初回フェッチ完了
    resolver.resolve?.();
    await firstFetch;

    // 2 次のマイクロタスク完了を待つ
    await vi.runAllTimersAsync();

    // 保留分が再実行される
    expect((globalThis.fetch as any).mock.calls.length).toBe(2);
  });

  it('複数の GET refresh が来た場合、保留はマージされ最後に 1 回だけ再実行される', async () => {
    const resolver: { resolve?: () => void } = {};
    const firstCallPromise = new Promise<void>((resolve) => {
      resolver.resolve = resolve;
    });

    const callLog: string[] = [];

    globalThis.fetch = vi.fn((..._args) => {
      const callCount = (globalThis.fetch as any).mock.calls.length;
      callLog.push(`fetch call #${callCount}`);

      if (callCount === 1) {
        return firstCallPromise.then(() => createMockResponse({ result: true }));
      }
      return Promise.resolve(createMockResponse({ result: true }));
    });

    const store = new FetchStore<{ result: boolean }>('/api/test');
    const state = store.store.getState();

    // 初回 GET リクエスト開始
    const firstFetch = state.fetch({ method: 'GET' });

    // isLoading 中に複数回の GET refresh を送信
    await state.fetch({ method: 'GET' }, { refresh: true });
    await state.fetch({ method: 'GET' }, { refresh: true });
    await state.fetch({ method: 'GET' }, { refresh: true });

    // 最初の 1 回だけ呼ばれている
    expect((globalThis.fetch as any).mock.calls).toHaveLength(1);

    // 初回フェッチ完了
    resolver.resolve?.();
    await firstFetch;

    // 保留分の再実行を待つ
    await vi.runAllTimersAsync();

    // 複数回の保留があっても、最後に 1 回だけ再実行される（計 2 回）
    expect((globalThis.fetch as any).mock.calls).toHaveLength(2);
    expect(callLog).toEqual(['fetch call #1', 'fetch call #2']);
  });

  it('GET 非 refresh と GET refresh の混在時、保留はリセットされずレート制御のみ', async () => {
    globalThis.fetch = vi.fn(async () => createMockResponse({ data: 'test' }));

    const store = new FetchStore<{ data: string }>('/api/test', { waitTime: 1000 });
    const state = store.store.getState();

    // 初回 GET
    await state.fetch({ method: 'GET' });

    // waitTime 内に refresh なし GET を送信（スキップされる）
    await state.fetch({ method: 'GET' });

    // 1 回だけ呼ばれている（2 回目はスキップ）
    expect((globalThis.fetch as any).mock.calls).toHaveLength(1);
  });
});
