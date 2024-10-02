import { throttle } from 'es-toolkit';
import { useEffect, useState } from 'react';

const initlVal: DOMRect = {
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: function () {
    throw new Error('Function not implemented.');
  },
};

/**
 * 要素の相対位置
 * @param element HTML Element
 * @returns {DOMRect} {bottom,height,left,right,top,width,x,y}
 */
export function useBoundingClient(element: HTMLElement | null): DOMRect {
  const [rect, setRect] = useState<DOMRect>(initlVal);
  /* サイズの更新 */
  const updateSize = throttle((): void => {
    if (element !== null) {
      setRect(element.getBoundingClientRect());
    }
  }, 250);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    /* ページ全体の要素 */
    const rootElement = document.documentElement;
    resizeObserver.observe(rootElement);
  }, [element]);

  return rect;
}
