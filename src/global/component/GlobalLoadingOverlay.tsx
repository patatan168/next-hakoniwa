/**
 * @module GlobalLoadingOverlay
 * @description グローバルローディングオーバーレイコンポーネント。
 */
'use client';

import { loadingCounterStore } from '@/global/store/loadingCounterStore';
import { useSyncExternalStore } from 'react';

/**
 * いずれかのAPIがロード中であれば、画面上部にプログレスバーを表示するコンポーネント
 * @remarks 背景を遮らないデザインでフリッカーを回避する
 */
export default function GlobalLoadingOverlay() {
  const count = useSyncExternalStore(
    loadingCounterStore.subscribe,
    () => loadingCounterStore.getState().count,
    () => 0
  );

  if (count <= 0) return null;

  return (
    <div
      aria-label="グローバルローディング"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5 overflow-hidden"
    >
      <div className="h-full animate-[loading-bar_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-green-400 to-transparent" />
    </div>
  );
}
