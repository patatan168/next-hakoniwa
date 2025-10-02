'use client';

import { useSyncExternalStore } from 'react';

const initSnapshot: [number, number] = [0, 0];
let cachedClientSnapshot: [number, number] = [0, 0];
const debounceDelay = 100;

/**
 * ウィンドウサイズを取得するカスタムフック（ResizeObserver + window resize）
 * @returns [width, height]
 */
export const useWindowSize = () => {
  const size = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return size;
};

const subscribe = (callback: () => void) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const updateSnapshot = () => {
    cachedClientSnapshot = [
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    ];
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

const getSnapshot = (): [number, number] => {
  if (typeof document === 'undefined') return initSnapshot;
  return cachedClientSnapshot;
};

const getServerSnapshot = (): [number, number] => initSnapshot;
