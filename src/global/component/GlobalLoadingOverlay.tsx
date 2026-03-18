/**
 * @module GlobalLoadingOverlay
 * @description グローバルローディングオーバーレイコンポーネント。
 */
'use client';

import { loadingCounterStore } from '@/global/store/loadingCounterStore';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

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

  return createPortal(
    <div
      aria-label="グローバルローディング"
      className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-[2147483647] h-1 overflow-hidden bg-emerald-200/70"
    >
      <div className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(5,150,105,0.75)]" />
    </div>,
    document.body
  );
}
