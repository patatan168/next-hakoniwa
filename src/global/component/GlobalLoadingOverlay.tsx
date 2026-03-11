'use client';

import Loading from '@/global/component/Loading';
import { loadingCounterStore } from '@/global/store/loadingCounterStore';
import { useSyncExternalStore } from 'react';

/**
 * いずれかのAPIがロード中であれば、画面全体をオーバーレイで覆うコンポーネント
 * @remarks loadingCounterStore の count を購読し、count > 0 のとき表示する
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30"
    >
      <Loading />
    </div>
  );
}
