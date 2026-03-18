/**
 * @module useWindowSize
 * @description ウィンドウサイズ監視カスタムフック。
 */
'use client';

import { useSyncExternalStore } from 'react';

type WindowSize = {
  width: number;
  height: number;
  minusFooterHeight: number;
  addressBarHeight: number;
};

const initSnapshot: WindowSize = { width: 0, height: 0, minusFooterHeight: 0, addressBarHeight: 0 };
let snapshot: WindowSize = initSnapshot;
const listeners = new Set<() => void>();

let cleanup: (() => void) | null = null;

/** クライアント環境かどうかを判定する */
const isClientSafe = () => typeof window !== 'undefined' && typeof document !== 'undefined';

/** モバイルのアドレスバー高さオフセットを取得する */
const getAddressBarHeightOffset = (): number => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isMobile ? Math.max(0, (window.outerHeight || 0) - (window.innerHeight || 0)) || 0 : 0;
};

/** ウィンドウの基本サイズを取得する */
const getBaseDimensions = () => ({
  width: window.innerWidth || document.documentElement.clientWidth,
  height: window.innerHeight || document.documentElement.clientHeight,
});

/** 入力可能な要素かどうかを判定する */
const isEditableElement = (element: Element | null): element is HTMLElement => {
  if (!(element instanceof HTMLElement)) return false;

  const tagName = element.tagName;
  return (
    element.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  );
};

/** ビューポートを考慮した正確なウィンドウサイズを計算する */
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

/** 値を小数第3位で丸める */
const roundValue = (value: number) => Math.round(value * 1000) / 1000;

/** 入力中にウィンドウ高さを保持すべきかを判定する */
const shouldPreserveHeightWhileTyping = (nextWidth: number, nextHeight: number) => {
  if (snapshot.height === 0) return false;
  if (Math.round(nextWidth) !== Math.round(snapshot.width)) return false;
  if (nextHeight >= snapshot.height) return false;
  if (!isEditableElement(document.activeElement)) return false;

  const viewport = window.visualViewport;
  if (!viewport) return false;

  const { height: baseHeight } = getBaseDimensions();
  return viewport.height < baseHeight;
};

/** ウィンドウサイズのスナップショットを更新する */
const updateSnapshot = () => {
  if (!isClientSafe()) return;

  const footer = document.querySelector('footer');
  const footerHeight = footer ? footer.clientHeight : 0;
  const addressBarHeight = getAddressBarHeightOffset();

  const { width, height } = calculateExactDimensions();
  const safeHeight = shouldPreserveHeightWhileTyping(width, height) ? snapshot.height : height;

  const newSnapshot = {
    width: roundValue(width),
    height: roundValue(safeHeight),
    minusFooterHeight: roundValue(safeHeight - footerHeight - 7),
    addressBarHeight: roundValue(addressBarHeight),
  };

  const isChanged =
    newSnapshot.width !== snapshot.width ||
    newSnapshot.height !== snapshot.height ||
    newSnapshot.minusFooterHeight !== snapshot.minusFooterHeight ||
    newSnapshot.addressBarHeight !== snapshot.addressBarHeight;

  if (isChanged) {
    snapshot = newSnapshot;
    listeners.forEach((listener) => listener());
  }
};

// スロットリング・デバウンスを行わず、イベントに即座に反応させる

/** useSyncExternalStore用のsubscribe関数 */
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

/** 現在のスナップショットを返す */
const getSnapshot = (): WindowSize => {
  return snapshot;
};

/** サーバーサイドで使用する初期スナップショットを返す */
const getServerSnapshot = (): WindowSize => initSnapshot;

/**
 * ウィンドウサイズを取得するカスタムフック（ResizeObserver + window resize）
 * @returns {WindowSize}
 */
export const useWindowSize = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
