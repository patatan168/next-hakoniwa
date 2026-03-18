/**
 * @module useDragReorder
 * @description ドラッグ並び替え用カスタムフック。
 */
import { useCallback, useEffect, useRef, useState } from 'react';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** スクロール開始までのコンテナ端からの距離(px) */
const EDGE_THRESHOLD = 50;

/** 自動スクロールの最大速度(px/frame) */
const MAX_SPEED = 12;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type DragReorderParams<T> = {
  /** 現在のアイテム配列を取得する関数 */
  getItems: () => T[];
  /** 並び替え確定時の反映先 */
  setItems: (items: T[]) => void;
};

type DragReorderReturn<T> = {
  /** ドラッグ中のアイテムID（null = 非ドラッグ中） */
  draggedId: number | null;
  /** プレビュー表示用アイテム配列（null時は元配列を使用） */
  previewItems: T[] | null;
  /** ドラッグハンドルのpointerdownハンドラ */
  handlePointerDown: (e: React.PointerEvent, id: number) => void;
  /** 各行DOMをRefMapに登録するコールバック */
  setItemRowRef: (id: number, el: HTMLElement | null) => void;
  /** スクロールコンテナDOMを登録するコールバック */
  setScrollContainer: (node: HTMLDivElement | null) => void;
};

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

/**
 * ドラッグによるリスト並び替えと自動スクロールを提供
 * @param params getItems / setItems
 */
export const useDragReorder = <T extends { id: number }>(
  params: DragReorderParams<T>
): DragReorderReturn<T> => {
  const { getItems, setItems } = params;

  // ── State ──
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [previewItems, setPreviewItems] = useState<T[] | null>(null);

  // ── Refs ──
  const previewItemsRef = useRef<T[] | null>(null);
  const draggedIdRef = useRef<number | null>(null);
  const itemRowsRef = useRef<Map<number, HTMLElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const pointerYRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // ── 最近傍行検索による並び替え ──
  const sortByProximity = useCallback(
    (clientY: number) => {
      const currentDraggedId = draggedIdRef.current;
      if (currentDraggedId === null) return;

      let closestId: number | null = null;
      let closestDist = Infinity;
      itemRowsRef.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(clientY - midY);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
        }
      });

      if (closestId === null || closestId === currentDraggedId) return;
      const targetId = closestId;

      setPreviewItems((prev) => {
        const current = prev || getItems();
        const oldIndex = current.findIndex((item) => item.id === currentDraggedId);
        const newIndex = current.findIndex((item) => item.id === targetId);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return current;

        const next = [...current];
        const [movedItem] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, movedItem);
        previewItemsRef.current = next;
        return next;
      });
    },
    [getItems]
  );

  // ── 自動スクロール ──
  const stopAutoScroll = useCallback(() => {
    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;

    const tick = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const y = pointerYRef.current;
      const distFromTop = y - rect.top;
      const distFromBottom = rect.bottom - y;

      let speed = 0;
      if (distFromTop < EDGE_THRESHOLD) {
        // 上端に近いほど速く上スクロール
        speed = -MAX_SPEED * (1 - distFromTop / EDGE_THRESHOLD);
      } else if (distFromBottom < EDGE_THRESHOLD) {
        // 下端に近いほど速く下スクロール
        speed = MAX_SPEED * (1 - distFromBottom / EDGE_THRESHOLD);
      }

      if (speed !== 0) {
        container.scrollTop += speed;
        // スクロール後に並び替え位置を再計算
        sortByProximity(pointerYRef.current);
      }

      scrollRafRef.current = requestAnimationFrame(tick);
    };

    scrollRafRef.current = requestAnimationFrame(tick);
  }, [sortByProximity]);

  // ── ドロップ確定 ──
  const commitDrop = useCallback(() => {
    stopAutoScroll();
    const latestPreview = previewItemsRef.current;
    if (latestPreview) {
      setItems(latestPreview);
    }
    setPreviewItems(null);
    previewItemsRef.current = null;
    draggedIdRef.current = null;
    setDraggedId(null);
    document.body.classList.remove('is-dragging');
  }, [setItems, stopAutoScroll]);

  // ── PointerDown ──
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: number) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      draggedIdRef.current = id;
      setDraggedId(id);
      setPreviewItems(getItems());
      document.body.classList.add('is-dragging');

      const onMove = (ev: PointerEvent) => {
        pointerYRef.current = ev.clientY;
        sortByProximity(ev.clientY);
      };

      startAutoScroll();

      const onUp = () => {
        commitDrop();
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        cleanupRef.current = null;
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      cleanupRef.current = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };
    },
    [getItems, sortByProximity, commitDrop, startAutoScroll]
  );

  // ── アンマウント時クリーンアップ ──
  useEffect(
    () => () => {
      cleanupRef.current?.();
      stopAutoScroll();
    },
    [stopAutoScroll]
  );

  // ── RefMap操作のコールバック ──
  const setItemRowRef = useCallback((id: number, el: HTMLElement | null) => {
    if (el) itemRowsRef.current.set(id, el);
    else itemRowsRef.current.delete(id);
  }, []);

  const setScrollContainer = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
  }, []);

  return {
    draggedId,
    previewItems,
    handlePointerDown,
    setItemRowRef,
    setScrollContainer,
  };
};
