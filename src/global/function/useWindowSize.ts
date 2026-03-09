'use client';

import { useSyncExternalStore } from 'react';

type WindowSize = {
  width: number;
  height: number;
  minusFooterHeight: number;
};

const initSnapshot: WindowSize = { width: 0, height: 0, minusFooterHeight: 0 };
let snapshot: WindowSize = initSnapshot;
const listeners = new Set<() => void>();

let cleanup: (() => void) | null = null;

const updateSnapshot = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const footerHeight = document.querySelector('footer')?.clientHeight ?? 0;

  // 視覚的なビューポート（モバイルのバーを除いた実際の表示領域）を優先する
  const viewport = window.visualViewport;
  const height = viewport ? viewport.height : document.documentElement.clientHeight;
  const width = viewport ? viewport.width : document.documentElement.clientWidth;

  const newSnapshot = {
    width: Math.round(width * 1000) / 1000,
    height: Math.round(height * 1000) / 1000,
    minusFooterHeight: Math.round((height - footerHeight - 7) * 1000) / 1000,
  };

  if (
    newSnapshot.width !== snapshot.width ||
    newSnapshot.height !== snapshot.height ||
    newSnapshot.minusFooterHeight !== snapshot.minusFooterHeight
  ) {
    snapshot = newSnapshot;
    listeners.forEach((listener) => listener());
  }
};

// スロットリング・デバウンスを行わず、イベントに即座に反応させる

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  if (listeners.size === 1) {
    // First listener added, start observing
    updateSnapshot(); // Initial update
    const resizeObserver = new ResizeObserver(updateSnapshot);
    resizeObserver.observe(document.documentElement);
    window.addEventListener('resize', updateSnapshot, { passive: true });

    // モバイルブラウザのバー表示・非表示を検知するために visualViewport を監視
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', updateSnapshot, { passive: true });
      viewport.addEventListener('scroll', updateSnapshot, { passive: true });
    }

    cleanup = () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSnapshot);
      if (viewport) {
        viewport.removeEventListener('resize', updateSnapshot);
        viewport.removeEventListener('scroll', updateSnapshot);
      }
    };
  }

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && cleanup) {
      cleanup();
      cleanup = null;
    }
  };
};

const getSnapshot = (): WindowSize => {
  return snapshot;
};

const getServerSnapshot = (): WindowSize => initSnapshot;

/**
 * ウィンドウサイズを取得するカスタムフック（ResizeObserver + window resize）
 * @returns {WindowSize}
 */
export const useWindowSize = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
