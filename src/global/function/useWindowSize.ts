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

const isClientSafe = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const getAddressBarHeightOffset = (): number => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isMobile ? Math.max(0, (window.outerHeight || 0) - (window.innerHeight || 0)) || 0 : 0;
};

const getBaseDimensions = () => ({
  width: window.innerWidth || document.documentElement.clientWidth,
  height: window.innerHeight || document.documentElement.clientHeight,
});

const calculateExactDimensions = () => {
  const { width: baseWidth, height: baseHeight } = getBaseDimensions();
  const addressBarHeight = getAddressBarHeightOffset();
  const viewport = window.visualViewport;

  if (!viewport) {
    return { width: baseWidth, height: baseHeight + addressBarHeight };
  }

  const scale = viewport.scale || 1;
  return {
    width: viewport.width * scale,
    height: viewport.height * scale + addressBarHeight,
  };
};

const roundValue = (value: number) => Math.round(value * 1000) / 1000;

const updateSnapshot = () => {
  if (!isClientSafe()) return;

  const footer = document.querySelector('footer');
  const footerHeight = footer ? footer.clientHeight : 0;

  const { width, height } = calculateExactDimensions();

  const newSnapshot = {
    width: roundValue(width),
    height: roundValue(height),
    minusFooterHeight: roundValue(height - footerHeight - 7),
  };

  const isChanged =
    newSnapshot.width !== snapshot.width ||
    newSnapshot.height !== snapshot.height ||
    newSnapshot.minusFooterHeight !== snapshot.minusFooterHeight;

  if (isChanged) {
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
