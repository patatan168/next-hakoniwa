import { planSchemaType } from '@/db/schema/planTable';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isEqual, omit, sortBy, uniqBy } from 'es-toolkit';
import {
  CSSProperties,
  forwardRef,
  memo,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { IoArrowRedo, IoArrowUndo, IoSendSharp, IoTrash } from 'react-icons/io5';
import { RxDragHandleVertical } from 'react-icons/rx';
import META_DATA from '../define/metadata';
import { getPlanDefine, getPlanSelect } from '../define/planType';
import { useClientFetch } from '../function/fetch/clientFetch';
import { planStore } from '../store/api/auth/plan';
import { usePlanDataStore } from '../store/usePlanDataStore';
import { planInfoZod, planInfoZodValid } from '../valid/planInfo';
import Button from './Button';
import { RangeSliderRHF } from './RangeSliderRHF';
import { SelectRHF } from './SelectRHF';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type LocalPlanItem = planSchemaType & {
  id: number;
  edit: boolean;
};

type PlanItemProps = {
  isChange: boolean;
  islandOptions: Array<{ label: string; value: string }>;
  item: Omit<LocalPlanItem, 'from_uuid'>;
  onUpdate: (id: number, data: Partial<LocalPlanItem>) => void;
  turn: number;
  onDelete: (id: number) => void;
  isDragged: boolean;
  /** ドラッグハンドルのpointerdownイベント */
  onPointerDown: (e: React.PointerEvent, id: number) => void;
};

// -----------------------------------------------------------------------------
// Component: PlanItem
// -----------------------------------------------------------------------------

const PlanItem = memo(
  forwardRef<HTMLDivElement, PlanItemProps>(
    (
      {
        isChange,
        islandOptions,
        item,
        onUpdate,
        turn,
        onDelete,
        isDragged,
        onPointerDown,
      }: PlanItemProps,
      itemRef
    ) => {
      const { id, x, y, plan, times, edit } = item;
      const { name, immediate, otherIsland, maxTimes } = getPlanDefine(plan);

      const { control, subscribe, reset, setValue } = useForm<Omit<planInfoZod, 'from_uuid'>>({
        defaultValues: item,
        resolver: zodResolver(planInfoZodValid.omit({ from_uuid: true })),
      });

      useEffect(() => {
        reset(item);
      }, [item, reset]);

      useEffect(() => {
        const unsubscribe = subscribe({
          formState: { values: true },
          callback: ({ values }) => {
            const formData = planInfoZodValid.omit({ from_uuid: true }).safeParse(values);
            if (!formData.success) return;

            const data = formData.data;
            if (!isEqual(data, omit(item, ['id']))) {
              Promise.resolve().then(() => {
                onUpdate(item.id, { ...data, edit: data.edit ?? false });
              });
            }
          },
        });
        return () => unsubscribe();
      }, [subscribe, item, onUpdate]);

      const toggleEdit = () => setValue('edit', !edit);

      return (
        <div
          ref={itemRef}
          className={`card-border mb-0.5 flex items-stretch gap-y-1 ${isChange ? 'bg-orange-50' : 'bg-teal-50'} ${isDragged ? 'opacity-50' : ''}`}
        >
          {/* ドラッグハンドル: pointerdown のみを受け付ける */}
          <div
            className="flex cursor-grab items-stretch"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => onPointerDown(e, id)}
          >
            <div className={`flex items-stretch`}>
              <span className="inline-flex h-full items-center justify-center rounded-sm bg-orange-200 text-gray-400">
                <RxDragHandleVertical />
              </span>
            </div>
            <span
              className={`md:text-md inline-block min-w-[3em] self-center font-mono text-sm text-shadow-xs/30 ${immediate ? 'text-sky-500' : ''}`}
            >
              {`T${turn}`}
            </span>
          </div>

          <button
            onClick={toggleEdit}
            className={`mx-2 bg-sky-700 px-1.5 text-white hover:cursor-pointer hover:bg-sky-600`}
          >
            <p className="text-md text-center font-semibold [writing-mode:vertical-rl]">
              {edit ? 'Close' : 'Edit'}
            </p>
          </button>

          <div className="grid min-w-0 flex-1 gap-0">
            {!edit && (
              <span
                className={`font-mono text-sm font-extrabold text-shadow-md md:text-base`}
              >{`(${x},${y})`}</span>
            )}
            {edit ? (
              <div className="grid w-full grid-cols-1 gap-2 p-1 md:grid-cols-2 md:gap-4">
                <div className="flex items-center gap-2">
                  <SelectRHF
                    name="plan"
                    control={control}
                    id={`plan-${item.id}`}
                    options={getPlanSelect()}
                    isBottomSpace={false}
                    className="w-full flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className="text-sm font-bold whitespace-nowrap md:text-base"
                    htmlFor={`to_uuid-${item.id}`}
                  >
                    目標島
                  </label>
                  <SelectRHF
                    name="to_uuid"
                    control={control}
                    id={`to_uuid-${item.id}`}
                    options={islandOptions}
                    isBottomSpace={false}
                    disabled={!otherIsland}
                    className="w-full flex-1"
                  />
                </div>
                <div className="flex items-center gap-3 xl:gap-2">
                  <label
                    className="text-sm font-bold whitespace-nowrap md:text-base"
                    htmlFor={`x-${item.id}`}
                  >
                    X座標
                  </label>
                  <div className="flex-1 text-sm">
                    <RangeSliderRHF
                      id={`x-${item.id}`}
                      name="x"
                      control={control}
                      max={META_DATA.MAP_SIZE - 1}
                      isBottomSpace={false}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 xl:gap-2">
                  <label
                    className="text-sm font-bold whitespace-nowrap md:text-base"
                    htmlFor={`y-${item.id}`}
                  >
                    Y座標
                  </label>
                  <div className="flex-1 text-sm">
                    <RangeSliderRHF
                      id={`y-${item.id}`}
                      name="y"
                      control={control}
                      max={META_DATA.MAP_SIZE - 1}
                      isBottomSpace={false}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex max-w-md items-center gap-2 md:col-span-2">
                  <label
                    className="text-sm font-bold whitespace-nowrap md:text-base"
                    htmlFor={`times-${item.id}`}
                  >
                    計画数
                  </label>
                  <div className="flex-1">
                    <RangeSliderRHF
                      id={`times-${item.id}`}
                      name="times"
                      control={control}
                      min={1}
                      max={maxTimes}
                      isBottomSpace={false}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <span
                className={`ml-2 text-sm font-medium text-shadow-xs/30 md:text-xl ${immediate ? 'text-sky-500' : 'text-amber-500'}`}
              >
                {name}
              </span>
            )}
          </div>

          {times > 1 && !edit && (
            <span className="font-mono text-xl text-shadow-xs/30">{`[${times}回]`}</span>
          )}

          <button
            onClick={() => onDelete(id)}
            className="ml-auto p-2 text-gray-400 transition-colors hover:cursor-pointer hover:text-red-600 focus:outline-none"
            aria-label="Delete plan"
          >
            <IoTrash className="text-xl" />
          </button>
        </div>
      );
    }
  ),
  (prev: PlanItemProps, next: PlanItemProps) =>
    isEqual(prev.item, next.item) &&
    prev.turn === next.turn &&
    prev.isChange === next.isChange &&
    prev.isDragged === next.isDragged &&
    isEqual(prev.islandOptions, next.islandOptions)
);

PlanItem.displayName = 'PlanItem';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const createDefaultPlan = (uuid: string): LocalPlanItem[] =>
  Array.from({ length: META_DATA.PLAN_LENGTH }, (_, i) => ({
    id: i,
    plan_no: i,
    edit: false,
    from_uuid: uuid,
    to_uuid: uuid,
    times: 1,
    x: 0,
    y: 0,
    plan: 'financing',
  }));

const getTurnList = (items: LocalPlanItem[], startTurn: number) => {
  let currentTurn = startTurn + 1;
  return items.map((item) => {
    const turn = currentTurn;
    const { immediate } = getPlanDefine(item.plan);
    if (!immediate) currentTurn += item.times;
    return turn;
  });
};

// -----------------------------------------------------------------------------
// Main Component: PlanList
// -----------------------------------------------------------------------------

const PlanList = memo(
  ({
    ref,
    className,
    style,
    islandList,
    isPlanLoading,
    turn = 0,
    uuid,
    initPlanData,
  }: PlanListProps) => {
    const { fetch: trigger } = useClientFetch(planStore);
    const [listRef, animateList] = useAutoAnimate<HTMLDivElement>();

    // 初回マウント時はアニメーションを抑制（リスト展開時のアニメーション防止）
    useEffect(() => {
      animateList(false);
      const id = requestAnimationFrame(() => animateList(true));
      return () => cancelAnimationFrame(id);
    }, [animateList]);

    const planListData = usePlanDataStore((state) => state.planListData);
    const setPostData = usePlanDataStore((state) => state.setPostData);
    const resetStore = usePlanDataStore((state) => state.reset);
    const setInitData = usePlanDataStore((state) => state.setInitData);
    const postData = usePlanDataStore((state) => state.postData);
    const isChange = usePlanDataStore((state) => state.isChange);
    const items = usePlanDataStore((state) => state.items);
    const historyIndex = usePlanDataStore((state) => state.historyIndex);
    const setItems = usePlanDataStore((state) => state.setItems);
    const undo = usePlanDataStore((state) => state.undo);
    const redo = usePlanDataStore((state) => state.redo);
    const deleteItem = usePlanDataStore((state) => state.deleteItem);

    // propsを元に、あるべき初期状態を計算
    const computedItems = useMemo(() => {
      if (isPlanLoading || !uuid) return [];

      const baseItems = sortBy(
        uniqBy([...(initPlanData ?? []), ...createDefaultPlan(uuid)], (item) => item.plan_no),
        ['plan_no']
      );

      // PLAN_LENGTH に合わせる
      const lengthAdjusted = baseItems.slice(0, META_DATA.PLAN_LENGTH);
      if (lengthAdjusted.length < META_DATA.PLAN_LENGTH) {
        const padding = createDefaultPlan(uuid).slice(lengthAdjusted.length);
        lengthAdjusted.push(...padding);
      }

      return lengthAdjusted.map((item, index) => ({
        ...item,
        id: index,
        plan_no: index,
        edit: false,
      }));
    }, [uuid, isPlanLoading, initPlanData]);

    const currentUuid = usePlanDataStore((state) => state.currentUuid);

    // 外部Storeへの同期（副作用）
    useEffect(() => {
      if (!isPlanLoading && uuid) {
        const store = usePlanDataStore.getState();
        // UUIDが変わった、または初期データが変わった場合のみ更新
        // NOTE: Layout切り替えなどで再マウントされた際に、編集中のデータを消さないようにする
        const isInitDataChanged = !isEqual(store.initData, initPlanData);

        if (currentUuid !== uuid) {
          resetStore();
        }

        if (currentUuid !== uuid || isInitDataChanged) {
          setInitData(initPlanData, uuid);
          setItems(computedItems, false); // 初期ロード時は履歴に残さない
        }
      }
    }, [
      uuid,
      isPlanLoading,
      initPlanData,
      resetStore,
      setInitData,
      setItems,
      computedItems,
      currentUuid,
    ]);

    useEffect(() => {
      const cleanData = items
        .filter((item) => item.plan !== 'financing')
        .map((item) => omit(item, ['id', 'edit']));
      setPostData(cleanData);
    }, [items, setPostData]);

    // アイテム更新
    const handleUpdateItem = useCallback(
      (id: number, data: Partial<LocalPlanItem>) => {
        const prev = usePlanDataStore.getState().items;
        const next = prev.map((item) => (item.id === id ? { ...item, ...data } : item));
        setItems(next);
      },
      [setItems]
    );

    // 削除
    const handleDeleteItem = useCallback(
      (id: number) => {
        deleteItem(id);
      },
      [deleteItem]
    );

    // 並び替え (Pointer Events + Auto Animate)
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [previewItems, setPreviewItems] = useState<LocalPlanItem[] | null>(null);
    const previewItemsRef = useRef<LocalPlanItem[] | null>(null);
    const draggedIdRef = useRef<number | null>(null);
    // コンテナ内の各行DOMを参照するためのRefMap
    const itemRowsRef = useRef<Map<number, HTMLElement>>(new Map());
    // 自動スクロール用
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const scrollRafRef = useRef<number | null>(null);
    const pointerYRef = useRef(0);

    const sortByProximity = useCallback((clientY: number) => {
      const draggedId = draggedIdRef.current;
      if (draggedId === null) return;

      // カーソルのY座標に最も近い行を特定
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

      if (closestId === null || closestId === draggedId) return;
      const targetId = closestId;

      setPreviewItems((prev) => {
        const current = prev || usePlanDataStore.getState().items;
        const oldIndex = current.findIndex((item) => item.id === draggedId);
        const newIndex = current.findIndex((item) => item.id === targetId);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return current;

        const newItems = [...current];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);
        previewItemsRef.current = newItems;
        return newItems;
      });
    }, []);

    /** 自動スクロールループ（ドラッグ中のみ稼働） */
    const stopAutoScroll = useCallback(() => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    }, []);

    const startAutoScroll = useCallback(() => {
      if (scrollRafRef.current !== null) return;

      const EDGE_THRESHOLD = 50;
      const MAX_SPEED = 12;

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

    /** pointermove / pointerup のリスナーをクリーンアップする関数 */
    const cleanupRef = useRef<(() => void) | null>(null);

    const commitDrop = useCallback(() => {
      stopAutoScroll();
      const latestPreview = previewItemsRef.current;
      if (latestPreview) {
        const reindexed = latestPreview.map((item, index) => ({ ...item, plan_no: index }));
        setItems(reindexed);
      }
      setPreviewItems(null);
      previewItemsRef.current = null;
      draggedIdRef.current = null;
      setDraggedId(null);
      document.body.classList.remove('is-dragging');
    }, [setItems, stopAutoScroll]);

    /**
     * PointerDown: ドラッグ開始時にポインターをキャプチャし、
     * document レベルの move / up リスナーをアタッチ
     */
    const handlePointerDown = useCallback(
      (e: React.PointerEvent, id: number) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

        draggedIdRef.current = id;
        setDraggedId(id);
        setPreviewItems(usePlanDataStore.getState().items);
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
      [sortByProximity, commitDrop, startAutoScroll]
    );

    // アンマウント時にリスナーを確実に解除
    useEffect(
      () => () => {
        cleanupRef.current?.();
        stopAutoScroll();
      },
      [stopAutoScroll]
    );

    // 描画用のアイテムリスト（プレビュー中ならプレビューを優先）
    const displayItems = previewItems || items;

    // Undo
    const handleUndo = useCallback(() => {
      undo();
    }, [undo]);

    const handleRedo = useCallback(() => {
      redo();
    }, [redo]);

    const islandOptions = useMemo(() => {
      if (!islandList) return [{ label: 'Loading...', value: '' }];
      return islandList.map((island) => ({
        label: `${island.island_name} 島`,
        value: island.uuid,
      }));
    }, [islandList]);

    const turnList = useMemo(() => getTurnList(displayItems, turn), [displayItems, turn]);

    const handleRef = useCallback(
      (node: HTMLDivElement | null) => {
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;

        scrollContainerRef.current = node;
        listRef(node);
      },
      [listRef, ref]
    );

    return (
      <>
        <div className="grid grid-cols-2 px-4 pb-1">
          <div>
            <Button
              type="submit"
              icons={<IoSendSharp />}
              onClick={() => {
                trigger({
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(postData),
                });
                resetStore();
              }}
              disabled={!isChange || isPlanLoading}
            >
              計画送信
            </Button>
          </div>
          <div className="flex items-center justify-end gap-5">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-300"
              disabled={planListData.length <= historyIndex + 1}
              aria-label="Undo"
              onClick={handleUndo}
            >
              <IoArrowUndo className="text-xl" />
              戻る
            </button>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-300"
              disabled={historyIndex === 0 || historyIndex === planListData.length}
              aria-label="Redo"
              onClick={handleRedo}
            >
              <IoArrowRedo className="text-xl" />
              進む
            </button>
          </div>
        </div>

        <div ref={handleRef} className={className} style={style}>
          {displayItems.map((item, index) => {
            const itemProps = omit(item, ['from_uuid']);
            return (
              <PlanItem
                key={`item-${item.id}`}
                ref={(el) => {
                  if (el) itemRowsRef.current.set(item.id, el);
                  else itemRowsRef.current.delete(item.id);
                }}
                isChange={isChange}
                islandOptions={islandOptions}
                item={itemProps}
                onUpdate={handleUpdateItem}
                turn={turnList[index]}
                onDelete={handleDeleteItem}
                isDragged={draggedId === item.id}
                onPointerDown={(e) => handlePointerDown(e, item.id)}
              />
            );
          })}
        </div>
      </>
    );
  }
);

PlanList.displayName = 'PlanList';

type PlanListProps = {
  ref?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
  islandList?: { uuid: string; island_name: string }[];
  isPlanLoading: boolean;
  turn?: number;
  uuid?: string;
  initPlanData?: Array<planSchemaType>;
};

export default PlanList;
