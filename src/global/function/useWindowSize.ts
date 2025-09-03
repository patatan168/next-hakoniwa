'use client';

import { throttle } from 'es-toolkit';
import { useEffect, useState } from 'react';

/**
 * ウィンドウのサイズを取得するカスタムフック
 * @returns [width, height]
 */
export function useWindowSize(): number[] {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return; // SSRガード

    const updateSize = throttle(() => {
      setWidth(document.documentElement.clientWidth);
      setHeight(document.documentElement.clientHeight);
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(document.documentElement);
    updateSize(); // 初期値の設定

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return [width, height];
}
