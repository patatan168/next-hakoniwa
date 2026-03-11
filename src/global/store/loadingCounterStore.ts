import { createStore } from 'zustand/vanilla';

type LoadingCounterState = {
  count: number;
  /** ロード開始時にカウントを増やす */
  increment: () => void;
  /** ロード終了時にカウントを減らす（0 未満にはならない） */
  decrement: () => void;
};

/**
 * アプリ全体のAPIローディング数を管理するグローバルストア
 * @remarks FetchStore が fetch を開始・終了する際にインクリメント/デクリメントする
 */
export const loadingCounterStore = createStore<LoadingCounterState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));
