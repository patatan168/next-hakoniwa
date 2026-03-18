/**
 * @module PlanList
 * @description 計画リスト全体の表示・編集・送信を管理するコンポーネント。
 */
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { isEqual, omit, sortBy, uniqBy } from 'es-toolkit';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { IoArrowRedo, IoArrowUndo, IoSendSharp } from 'react-icons/io5';
import META_DATA from '../define/metadata';
import { getPlanDefine } from '../define/planType';
import { useClientFetch } from '../function/fetch/clientFetch';
import { useDragReorder } from '../function/useDragReorder';
import { planStore } from '../store/api/auth/plan';
import { usePlanDataStore } from '../store/usePlanDataStore';
import Button from './Button';
import PlanItem from './PlanItem';
import { LocalPlanItem, PlanListProps } from './PlanList.types';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** デフォルト計画（資金繰り）の生成 */
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

/** ターン番号リストの算出 */
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
    const currentUuid = usePlanDataStore((state) => state.currentUuid);

    // ── 初期状態の算出 ──
    const computedItems = useMemo(() => {
      if (isPlanLoading || !uuid) return [];

      const baseItems = sortBy(
        uniqBy([...(initPlanData ?? []), ...createDefaultPlan(uuid)], (item) => item.plan_no),
        ['plan_no']
      );

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

    // ── Storeへの同期 ──
    useEffect(() => {
      if (!isPlanLoading && uuid) {
        const store = usePlanDataStore.getState();
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

    // ── アイテム操作 ──
    const handleUpdateItem = useCallback(
      (id: number, data: Partial<LocalPlanItem>) => {
        const prev = usePlanDataStore.getState().items;
        const next = prev.map((item) => (item.id === id ? { ...item, ...data } : item));
        setItems(next);
      },
      [setItems]
    );

    const handleDeleteItem = useCallback(
      (id: number) => {
        deleteItem(id);
      },
      [deleteItem]
    );

    // ── ドラッグ並び替え ──
    const getItems = useCallback(() => usePlanDataStore.getState().items, []);
    const commitItems = useCallback(
      (newItems: LocalPlanItem[]) => {
        const reindexed = newItems.map((item, index) => ({ ...item, plan_no: index }));
        setItems(reindexed);
      },
      [setItems]
    );

    const { draggedId, previewItems, handlePointerDown, setItemRowRef, setScrollContainer } =
      useDragReorder({ getItems, setItems: commitItems });

    // ドラッグ中と初回マウント時はアニメーションを抑制
    // draggedId が使用可能になってから呼び出す
    useEffect(() => {
      if (draggedId !== null) {
        animateList(false);
      } else {
        animateList(false);
        const id = requestAnimationFrame(() => animateList(true));
        return () => cancelAnimationFrame(id);
      }
    }, [animateList, draggedId]);

    // 描画用のアイテムリスト（プレビュー中ならプレビューを優先）
    const displayItems = previewItems || items;

    // ── Undo / Redo ──
    const handleUndo = useCallback(() => undo(), [undo]);
    const handleRedo = useCallback(() => redo(), [redo]);

    // ── 派生データ ──
    const islandOptions = useMemo(() => {
      if (!islandList) return [{ label: 'Loading...', value: '' }];
      return islandList.map((island) => ({
        label: `${island.island_name} 島`,
        value: island.uuid,
      }));
    }, [islandList]);

    const turnList = useMemo(() => getTurnList(displayItems, turn), [displayItems, turn]);

    // ── Ref合成 ──
    const handleRef = useCallback(
      (node: HTMLDivElement | null) => {
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;

        setScrollContainer(node);
        listRef(node);
      },
      [listRef, ref, setScrollContainer]
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
                ref={(el) => setItemRowRef(item.id, el)}
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

export default PlanList;
