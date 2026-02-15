'use client';

import { useSyncExternalStore } from 'react';

type WindowSize = {
  width: number;
  height: number;
  minusFooterHeight: number;
};

const initSnapshot: WindowSize = { width: 0, height: 0, minusFooterHeight: 0 };
let cachedClientSnapshot: WindowSize = { width: 0, height: 0, minusFooterHeight: 0 };
const debounceDelay = 100;

/**
 * ウィンドウサイズを取得するカスタムフック（ResizeObserver + window resize）
 * @returns {WindowSize}
 */
export const useWindowSize = () => {
  const size = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return size;
};

const subscribe = (callback: () => void) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const updateSnapshot = () => {
    const footerHeight = document.querySelector('footer')?.clientHeight ?? 0;
    const height = document.documentElement.clientHeight;
    cachedClientSnapshot = {
      width: Math.round(document.documentElement.clientWidth * 1000) / 1000,
      height: Math.round(height * 1000) / 1000,
      minusFooterHeight: Math.round((height - footerHeight - 7) * 1000) / 1000,
    };
    callback();
  };

  const debouncedUpdate = () => {
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      updateSnapshot();
      timeoutId = null;
    }, debounceDelay);
  };

  const resizeObserver = new ResizeObserver(debouncedUpdate);
  resizeObserver.observe(document.documentElement);

  window.addEventListener('resize', debouncedUpdate);

  return () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', debouncedUpdate);
    if (timeoutId !== null) clearTimeout(timeoutId);
  };
};

const getSnapshot = (): WindowSize => {
  if (typeof document === 'undefined') return initSnapshot;
  return cachedClientSnapshot;
};

const getServerSnapshot = (): WindowSize => initSnapshot;
