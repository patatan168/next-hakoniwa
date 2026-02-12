import { planSchemaType } from '@/db/schema/planTable';
import { closestCenter, DndContext, DragEndEvent, DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { zodResolver } from '@hookform/resolvers/zod';
import { isEqual, omit, sortBy, uniqBy } from 'es-toolkit';
import { CSSProperties, memo, Ref, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { IoArrowRedo, IoArrowUndo } from 'react-icons/io5';
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
  setActivator: Ref<HTMLDivElement> | undefined;
  isDragging: boolean;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
};

// -----------------------------------------------------------------------------
// Component: PlanItem
// -----------------------------------------------------------------------------

const PlanItem = memo(
  ({
    isChange,
    islandOptions,
    item,
    onUpdate,
    turn,
    setActivator,
    isDragging,
    attributes,
    listeners,
  }: PlanItemProps) => {
    const { x, y, plan, times, edit } = item;
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
        ref={setActivator}
        className={`card-border mb-0.5 flex items-center ${isChange ? 'bg-orange-50' : 'bg-teal-50'}`}
      >
        <div className={`flex h-11 items-stretch ${edit ? 'h-33' : 'h-13'}`}>
          <span
            {...attributes}
            {...listeners}
            className={`inline-flex h-full items-center justify-center rounded-sm bg-orange-200 text-gray-400 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <RxDragHandleVertical />
          </span>
        </div>

        <span
          {...attributes}
          {...listeners}
          className={`inline-block min-w-[3em] font-mono text-shadow-xs/30 ${immediate ? 'text-sky-500' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {`T${turn}`}
        </span>

        <button
          onClick={toggleEdit}
          className={`mx-2 bg-sky-700 px-1.5 text-white hover:cursor-pointer hover:bg-sky-600 ${edit ? 'h-33' : 'h-13'}`}
        >
          <p className="text-md text-center font-semibold [writing-mode:vertical-rl]">
            {edit ? 'Close' : 'Edit'}
          </p>
        </button>

        <div className="grid min-w-28 gap-0">
          {!edit && (
            <span
              className={`font-mono text-base font-extrabold text-shadow-md`}
            >{`(${x},${y})`}</span>
          )}
          {edit ? (
            <div className="grid grid-cols-2 grid-cols-[auto_auto] gap-0">
              <div>
                <SelectRHF
                  className="mt-2"
                  name="plan"
                  control={control}
                  id={`plan-${item.id}`}
                  options={getPlanSelect()}
                  isBottomSpace={false}
                  style={{ width: 'fit-content' }}
                />
                <div className="flex items-center gap-0">
                  <label className="text-sm" htmlFor={`x-${item.id}`}>
                    X座標
                  </label>
                  <RangeSliderRHF
                    className="w-fit scale-75"
                    id={`x-${item.id}`}
                    name="x"
                    control={control}
                    max={META_DATA.MAP_SIZE - 1}
                    isBottomSpace={false}
                  />
                </div>
                <div className="flex items-center gap-0">
                  <label className="text-sm" htmlFor={`y-${item.id}`}>
                    Y座標
                  </label>
                  <RangeSliderRHF
                    className="w-fit scale-75"
                    id={`y-${item.id}`}
                    name="y"
                    control={control}
                    max={META_DATA.MAP_SIZE - 1}
                    isBottomSpace={false}
                  />
                </div>
              </div>
              <div>
                <div className="mt-2 flex items-center gap-0">
                  <label className="mr-2 text-sm" htmlFor={`to_uuid-${item.id}`}>
                    目標島
                  </label>
                  <SelectRHF
                    name="to_uuid"
                    control={control}
                    id={`to_uuid-${item.id}`}
                    options={islandOptions}
                    isBottomSpace={false}
                    disabled={!otherIsland}
                    style={{ width: 'fit-content' }}
                  />
                </div>
                <div className="flex items-center gap-0">
                  <label className="text-sm" htmlFor={`times-${item.id}`}>
                    計画数
                  </label>
                  <RangeSliderRHF
                    className="w-fit scale-75"
                    id={`times-${item.id}`}
                    name="times"
                    control={control}
                    min={1}
                    max={maxTimes}
                    isBottomSpace={false}
                  />
                </div>
              </div>
            </div>
          ) : (
            <span
              className={`ml-2 text-xl font-medium text-shadow-xs/30 ${immediate ? 'text-sky-500' : 'text-amber-500'}`}
            >
              {name}
            </span>
          )}
        </div>

        {times > 1 && !edit && (
          <span className="font-mono text-xl text-shadow-xs/30">{`[${times}回]`}</span>
        )}
      </div>
    );
  },
  (prev, next) =>
    isEqual(prev.item, next.item) &&
    prev.turn === next.turn &&
    prev.isChange === next.isChange &&
    prev.isDragging === next.isDragging &&
    isEqual(prev.islandOptions, next.islandOptions)
);

PlanItem.displayName = 'PlanItem';

// -----------------------------------------------------------------------------
// Component: SortableItem
// -----------------------------------------------------------------------------

const SortableItem = memo(
  ({ isChange, islandOptions, item, onUpdate, turn }: SortableItemProps) => {
    const {
      isDragging,
      setActivatorNodeRef,
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: item.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 999 : 'auto',
      position: 'relative' as const,
    };
    const itemProps = useMemo(() => omit(item, ['from_uuid']), [item]);
    return (
      <div ref={setNodeRef} style={style}>
        <PlanItem
          isChange={isChange}
          islandOptions={islandOptions}
          item={itemProps}
          onUpdate={onUpdate}
          turn={turn}
          setActivator={setActivatorNodeRef}
          isDragging={isDragging}
          attributes={attributes}
          listeners={listeners}
        />
      </div>
    );
  }
);

SortableItem.displayName = 'SortableItem';

type SortableItemProps = {
  isChange: boolean;
  islandOptions: Array<{ label: string; value: string }>;
  item: LocalPlanItem;
  onUpdate: (id: number, data: Partial<LocalPlanItem>) => void;
  turn: number;
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const createDefaultPlan = (uuid: string): LocalPlanItem[] =>
  Array.from({ length: 20 }, (_, i) => ({
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

    // propsを元に、あるべき初期状態を計算
    const computedItems = useMemo(() => {
      if (isPlanLoading || !uuid) return [];
      return sortBy(
        uniqBy([...(initPlanData ?? []), ...createDefaultPlan(uuid)], (item) => item.plan_no),
        ['plan_no']
      ).map((item, index) => ({ ...item, id: index, edit: false }));
    }, [uuid, isPlanLoading, initPlanData]);

    const myIslandName = useMemo(() => {
      if (!uuid || !islandList) return 'Loading';
      return islandList.find((item) => item.uuid === uuid)?.island_name;
    }, [uuid, islandList]);

    // 外部Storeへの同期（副作用）
    useEffect(() => {
      if (!isPlanLoading && uuid) {
        resetStore();
        setInitData(initPlanData);
        setItems(computedItems);
      }
    }, [uuid, isPlanLoading, initPlanData, resetStore, setInitData, setItems, computedItems]);

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

    // 並び替え
    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
          const prev = usePlanDataStore.getState().items;
          const oldIndex = prev.findIndex((item) => item.id === active.id);
          const newIndex = prev.findIndex((item) => item.id === over.id);
          const sorted = arrayMove(prev, oldIndex, newIndex);
          const reindexed = sorted.map((item, index) => ({ ...item, plan_no: index }));

          setItems(reindexed);
        }
      },
      [setItems]
    );

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

    const turnList = useMemo(() => getTurnList(items, turn), [items, turn]);

    return (
      <>
        <div className="text-bold mb-4 text-center text-3xl text-red-900">
          {`「${myIslandName}島」`}
          <span className="text-black">開発計画</span>
        </div>
        <div className="mb-2 flex gap-4">
          <Button
            type="submit"
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

        <div ref={ref} className={className} style={style}>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map((i) => i.id)}>
              {items.map((item, index) => (
                <SortableItem
                  key={`item-${item.id}`}
                  isChange={isChange}
                  islandOptions={islandOptions}
                  item={item}
                  onUpdate={handleUpdateItem}
                  turn={turnList[index]}
                />
              ))}
            </SortableContext>
          </DndContext>
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
