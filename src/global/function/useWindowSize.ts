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
  const height = document.documentElement.clientHeight;
  const newSnapshot = {
    width: Math.round(document.documentElement.clientWidth * 1000) / 1000,
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

    cleanup = () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSnapshot);
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
