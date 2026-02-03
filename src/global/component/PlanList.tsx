import { planSchemaType } from '@/db/schema/planTable';
import { Active, closestCenter, DndContext, DraggableAttributes, Over } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { zodResolver } from '@hookform/resolvers/zod';
import { isEqual, omit, sortBy, uniqBy } from 'es-toolkit';
import { CSSProperties, memo, Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { RxDragHandleVertical } from 'react-icons/rx';
import META_DATA from '../define/metadata';
import { getPlanDefine, getPlanSelect } from '../define/planType';
import { planInfoZod, planInfoZodValid } from '../valid/planInfo';
import { RangeSliderRHF } from './RangeSliderRHF';
import { SelectRHF } from './SelectRHF';

type planItemProps = {
  isChange: boolean;
  islandOptions: Array<{ label: string; value: string }>;
  item: Omit<planSchemaType, 'from_uuid' | 'id'> & { edit: boolean };
  setItem: (data: Omit<planSchemaType, 'from_uuid' | 'id'> & { edit: boolean }) => void;
  turn: number;
  setActivator: Ref<HTMLDivElement> | undefined;
  isDragging: boolean;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
};

const PlanItem = ({
  isChange,
  islandOptions,
  item,
  setItem,
  turn,
  setActivator,
  isDragging,
  attributes,
  listeners,
}: planItemProps) => {
  const { x, y, plan, times } = item;
  const { name, immediate, otherIsland, maxTimes } = getPlanDefine(plan);
  const { control, subscribe, reset, setValue } = useForm<Omit<planInfoZod, 'from_uuid'>>({
    defaultValues: item,
    resolver: zodResolver(
      planInfoZodValid.omit({
        from_uuid: true,
      })
    ),
  });

  const itemRef = useRef(item);

  useEffect(() => {
    itemRef.current = item;
    reset(item);
  }, [item, reset]);

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        const data = planInfoZodValid.omit({ from_uuid: true }).parse(values);
        if (!isEqual(data, itemRef.current)) {
          setItem(data);
        }
      },
    });

    return () => unsubscribe();
  }, [subscribe, setItem]);

  return (
    <div
      ref={setActivator}
      className={`card-border mb-0.5 flex items-center ${isChange ? 'bg-orange-50' : 'bg-teal-50'}`}
    >
      <div className={`flex h-11 items-stretch ${item.edit ? 'h-33' : 'h-13'}`}>
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          className="inline-flex h-full items-center justify-center rounded-sm bg-orange-200 text-gray-400"
        >
          <RxDragHandleVertical />
        </span>
      </div>

      {/* ターン表示 */}
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        className={`inline-block min-w-[3em] font-mono text-shadow-xs/30 ${immediate ? 'text-sky-500' : ''}`}
      >{`T${turn}`}</span>
      <button
        onClick={() => setValue('edit', !item.edit)}
        className={`mx-2 bg-sky-700 px-1.5 text-white hover:cursor-pointer hover:bg-sky-600 ${item.edit ? 'h-33' : 'h-13'}`}
      >
        <p className="text-md text-center font-semibold [writing-mode:vertical-rl]">
          {item.edit ? 'Close' : 'Edit'}
        </p>
      </button>

      {/* 座標と名前 */}
      <div className="grid min-w-28 gap-0">
        {!item.edit && (
          <span
            className={`font-mono text-base font-extrabold text-shadow-md`}
          >{`(${x},${y})`}</span>
        )}
        {item.edit ? (
          <>
            <div className="grid grid-cols-2 gap-0" style={{ gridTemplateColumns: 'auto auto' }}>
              <div>
                <SelectRHF
                  className="mt-2"
                  name="plan"
                  control={control}
                  id="plan"
                  options={getPlanSelect()}
                  isBottomSpace={false}
                />
                <div className="flex items-center gap-0">
                  <label className="text-sm" htmlFor="x">
                    X座標
                  </label>
                  <RangeSliderRHF
                    className="w-fit scale-75"
                    id="x"
                    name="x"
                    control={control}
                    max={META_DATA.MAP_SIZE - 1}
                    isBottomSpace={false}
                  />
                </div>
                <div className="flex items-center gap-0">
                  <label className="text-sm" htmlFor="y">
                    Y座標
                  </label>
                  <RangeSliderRHF
                    className="w-fit scale-75"
                    id="y"
                    name="y"
                    control={control}
                    max={META_DATA.MAP_SIZE - 1}
                    isBottomSpace={false}
                  />
                </div>
              </div>
              <div>
                <div className="mt-2 flex items-center gap-0">
                  <label className="mr-2 text-sm" htmlFor="to_uuid">
                    目標島
                  </label>
                  <SelectRHF
                    name="to_uuid"
                    control={control}
                    id="to_uuid"
                    options={islandOptions}
                    isBottomSpace={false}
                    disabled={!otherIsland}
                  />
                </div>
                <div className="flex items-center gap-0">
                  <label className="text-sm" htmlFor="times">
                    計画数
                  </label>
                  <RangeSliderRHF
                    className="w-fit scale-75"
                    id="times"
                    name="times"
                    control={control}
                    min={1}
                    max={maxTimes}
                    isBottomSpace={false}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <span
            className={`ml-2 text-xl font-medium text-shadow-xs/30 ${immediate ? 'text-sky-500' : 'text-amber-500'}`}
          >
            {name}
          </span>
        )}
      </div>

      {/* 回数 */}
      {times > 1 && !item.edit && (
        <span className="font-mono text-xl text-shadow-xs/30">{`[${times}回]`}</span>
      )}
    </div>
  );
};

type sortedItemProps = {
  isChange: boolean;
  islandOptions: Array<{ label: string; value: string }>;
  item: planSchemaType & { id: number } & { edit: boolean };
  setItem: (data: Omit<planSchemaType, 'from_uuid' | 'id'> & { edit: boolean }) => void;
  turn: number;
};

const SortableItem = memo(
  function SortableItem({ isChange, islandOptions, item, setItem, turn }: sortedItemProps) {
    const {
      isDragging,
      // 並び替えのつまみ部分に設定するプロパティ
      setActivatorNodeRef,
      attributes,
      listeners,
      // DOM全体に対して設定するプロパティ
      setNodeRef,
      transform,
      transition,
    } = useSortable({
      id: item.id,
    });
    // NOTE: 不要なプロパティを除外
    const omitItem = omit(item, ['id', 'from_uuid']);

    return (
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      >
        <PlanItem
          isChange={isChange}
          islandOptions={islandOptions}
          item={omitItem}
          setItem={setItem}
          turn={turn}
          setActivator={setActivatorNodeRef}
          isDragging={isDragging}
          attributes={attributes}
          listeners={listeners}
        />
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

const defaultPlan = (uuid: string): Array<planSchemaType & { id: number; edit: boolean }> => {
  const defaultPlan: Array<planSchemaType & { id: number; edit: boolean }> = [];

  for (let i = 0; i < 20; i++) {
    defaultPlan.push({
      id: i,
      edit: false,
      from_uuid: uuid,
      to_uuid: uuid,
      plan_no: i,
      times: 1,
      x: 0,
      y: 0,
      plan: 'financing',
    });
  }
  return defaultPlan;
};

const GetIslandOptions = (
  data: { uuid: string; island_name: string }[] | undefined
): { label: string; value: string }[] =>
  useMemo(() => {
    if (!data) return [{ label: 'Loading...', value: '' }];
    return data.map((island) => ({
      label: `${island.island_name} 島`,
      value: island.uuid,
    }));
  }, [data]);

type PlanListProps = {
  ref?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
  islandList?: { uuid: string; island_name: string }[];
  isPlanLoading: boolean;
  setPlanData: (data: Array<planSchemaType>) => void;
  turn?: number;
  uuid?: string;
  initPlanData?: Array<planSchemaType>;
};

export const PlanList = memo(
  function PlanList({
    ref,
    className,
    style,
    islandList,
    isPlanLoading,
    setPlanData,
    turn = 0,
    uuid,
    initPlanData,
  }: PlanListProps) {
    const [initItems, setInitItems] = useState<
      Array<planSchemaType & { id: number; edit: boolean }>
    >([]);
    const [items, setItems] =
      useState<Array<planSchemaType & { id: number; edit: boolean }>>(initItems);
    const isChange = useMemo(() => !isEqual(initItems, items), [initItems, items]);
    const isChangeRef = useRef(isChange);
    const islandOptions = GetIslandOptions(islandList);
    const prevUuid = useRef(uuid);
    const prevIsPlanLoading = useRef(isPlanLoading);
    const timerRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
      isChangeRef.current = isChange;
    }, [isChange]);

    // コンポーネントのアンマウント時にタイマーをクリアする
    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    const newItemsFromProps = useMemo(() => {
      if (isPlanLoading || !uuid) return [];
      return sortBy(
        uniqBy([...(initPlanData ?? []), ...defaultPlan(uuid)], (item) => item.plan_no),
        ['plan_no']
      ).map((item) => ({ ...item, id: item.plan_no, edit: false }));
    }, [isPlanLoading, uuid, initPlanData]);

    useEffect(() => {
      if (isPlanLoading || !uuid) return;

      const isUuidChanged = prevUuid.current !== uuid;
      prevUuid.current = uuid;

      const isLoaded = prevIsPlanLoading.current && !isPlanLoading;
      prevIsPlanLoading.current = isPlanLoading;

      // isChangeRef.currentがfalse（ユーザによる変更がない）、またはuuidが変更された、またはロード完了時は更新
      if (!isChangeRef.current || isUuidChanged || isLoaded) {
        setInitItems(newItemsFromProps);
        setItems(newItemsFromProps);
      }
    }, [isPlanLoading, uuid, newItemsFromProps]);

    useEffect(() => {
      if (isChange) {
        const omitFinancing = items.filter((item) => item.plan !== 'financing');
        const newPlanData = omitFinancing.map((obj) => omit(obj, ['id', 'edit']));
        // プランデータを更新
        setPlanData(newPlanData);
      }
    }, [isChange, items, setPlanData]);

    const sortPlan = (active: Active, over: Over) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const sortedItems = arrayMove(items, oldIndex, newIndex);
      // プランソート
      setItems(sortedItems);
      // NOTE: 描画後にプラン番号を変更する(アニメーションにバグが出るため)
      const changePlanNo = sortedItems.map((item, index) => ({ ...item, plan_no: index }));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setItems(changePlanNo), 0);
    };

    const setItem = useCallback(
      (data: Omit<planSchemaType, 'from_uuid' | 'id'> & { edit: boolean }) => {
        setItems((prev) => {
          const newItems = [...prev];
          newItems[data.plan_no] = { ...newItems[data.plan_no], ...data };
          const changePlanNo = newItems.map((item, index) => ({ ...item, plan_no: index }));
          return changePlanNo;
        });
      },
      []
    );

    const turnList = useMemo(() => {
      let currentTurn = turn + 1;
      return items.map((item) => {
        const startTurn = currentTurn;
        const { immediate } = getPlanDefine(item.plan);
        if (!immediate) {
          currentTurn += item.times;
        }
        return startTurn;
      });
    }, [items, turn]);

    return (
      <div ref={ref} className={className} style={style}>
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={({ active, over }) => {
            if (over !== null && active.id !== over.id) {
              sortPlan(active, over);
            }
          }}
        >
          <SortableContext items={items}>
            {items.map((item, index) => {
              return (
                <SortableItem
                  key={`item-${item.plan_no}`}
                  isChange={isChange}
                  islandOptions={islandOptions}
                  item={item}
                  setItem={setItem}
                  turn={turnList[index]}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
