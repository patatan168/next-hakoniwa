import { useCallback, useRef, useState, useSyncExternalStore } from 'react';

/**
 * 要素のDOMRect（位置とサイズ）を取得し、変更をリアルタイムに検知するカスタムフック
 *
 * @template T 対象要素の型
 * @returns [取得したDOMRect情報(未取得時はnull), 要素に設定するrefコールバック]
 */
export const useClientRect = <T extends HTMLElement = HTMLElement>() => {
  const [node, setNode] = useState<T | null>(null);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!node) return () => {};

      let rafId: number | null = null;
      let isActive = true; // クリーンアップ実行後の不要な更新を防ぐフラグ

      const throttledUpdate = () => {
        if (!isActive || rafId) return;
        rafId = window.requestAnimationFrame(() => {
          if (!isActive) return;
          onStoreChange();
          rafId = null;
        });
      };

      const resizeObserver = new ResizeObserver(throttledUpdate);
      resizeObserver.observe(node);

      window.addEventListener('resize', throttledUpdate);
      window.addEventListener('scroll', throttledUpdate, true);

      return () => {
        isActive = false;
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
        }
        resizeObserver.disconnect();
        window.removeEventListener('resize', throttledUpdate);
        window.removeEventListener('scroll', throttledUpdate, true);
      };
    },
    [node] // nodeがセットされた際にsubscribeを再構築してリスナーをアタッチする
  );

  const snapshotRef = useRef<DOMRect | null>(null);

  const getSnapshot = useCallback(() => {
    if (!node) return null;

    const newRect = node.getBoundingClientRect();
    const prev = snapshotRef.current;

    if (
      !prev ||
      prev.x !== newRect.x ||
      prev.y !== newRect.y ||
      prev.width !== newRect.width ||
      prev.height !== newRect.height
    ) {
      snapshotRef.current = newRect;
    }

    return snapshotRef.current;
  }, [node]);

  const getServerSnapshot = useCallback(() => null, []);

  // useSyncExternalStoreでStoreの変更をサブスクライブ
  const rect = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const ref = useCallback((nodeElem: T | null) => {
    setNode(nodeElem);
    if (!nodeElem) {
      snapshotRef.current = null;
    }
  }, []);

  return [rect, ref] as const;
};
