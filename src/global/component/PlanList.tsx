import { planSchemaType } from '@/db/schema/planTable';
import { Active, closestCenter, DndContext, DraggableAttributes, Over } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { zodResolver } from '@hookform/resolvers/zod';
import { isEqual, omit, sortBy, uniqBy } from 'es-toolkit';
import { CSSProperties, memo, Ref, useEffect, useMemo, useRef, useState } from 'react';
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
  item: Omit<planSchemaType, 'from_uuid' | 'id'>;
  setItem: (data: Omit<planSchemaType, 'from_uuid' | 'id'>) => void;
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
  const prevItemRef = useRef(item);
  const { x, y, plan, times } = item;
  const { name, immediate, otherIsland } = getPlanDefine(plan);
  const [edit, setEdit] = useState(false);
  const { control, subscribe, reset } = useForm<Omit<planInfoZod, 'from_uuid'>>({
    defaultValues: item,
    resolver: zodResolver(
      planInfoZodValid.omit({
        from_uuid: true,
      })
    ),
  });

  useEffect(() => {
    const isModifiedExternally = !isEqual(prevItemRef.current, item);
    if (isModifiedExternally) {
      // NOTE: 描画を待ってからフォームをリセット
      setTimeout(() => reset(item), 0);
      prevItemRef.current = item;
    }
  }, [item, reset]);

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        const data = planInfoZodValid.omit({ from_uuid: true }).parse(values);
        setItem(data);
      },
    });

    return () => unsubscribe();
  }, [subscribe]);

  return (
    <div
      ref={setActivator}
      className={`card-border mb-0.5 flex items-center ${isChange ? 'bg-orange-50' : 'bg-teal-50'}`}
    >
      <div className={`flex h-11 items-stretch ${edit ? 'h-32.5' : 'h-11'}`}>
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
        className={`inline-block min-w-12 font-mono ${immediate ? 'text-sky-500' : ''}`}
      >{`T${turn}`}</span>

      <button
        onClick={() => setEdit(!edit)}
        className={`mx-2 w-6 bg-sky-700 text-white hover:cursor-pointer hover:bg-sky-600 ${edit ? 'h-32.5' : 'h-11'}`}
      >
        <p className="text-md text-center font-semibold [writing-mode:vertical-rl]">
          {edit ? 'Close' : 'Edit'}
        </p>
      </button>

      {/* 座標と名前 */}
      <div className="grid min-w-28 gap-0">
        {!edit && (
          <span className={`font-mono text-sm font-bold text-shadow-md`}>{`(${x},${y})`}</span>
        )}
        {edit ? (
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
                    max={99}
                    isBottomSpace={false}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <span
            className={`ml-2 font-medium text-shadow-sm ${immediate ? 'text-sky-500' : 'text-amber-500'}`}
          >
            {name}
          </span>
        )}
      </div>

      {/* 回数 */}
      {times > 1 && !edit && <span className="font-mono">{`[${times}回]`}</span>}
    </div>
  );
};

type sortedItemProps = {
  isChange: boolean;
  islandOptions: Array<{ label: string; value: string }>;
  item: planSchemaType & { id: number };
  setItem: (data: Omit<planSchemaType, 'from_uuid' | 'id'>) => void;
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

const defaultPlan = (uuid: string): Array<planSchemaType & { id: number }> => {
  const defaultPlan: Array<planSchemaType & { id: number }> = [];

  for (let i = 0; i < 20; i++) {
    defaultPlan.push({
      id: i,
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

/**
 * 計画情報の正規化
 * @param planData 計画データの配列
 * @param uuid ユーザーのUUID
 * @param setInitItems 初期アイテムを設定する関数
 * @param setItems アイテムを設定する関数
 */
const useEffectNormalizePlanData = (
  initItems: Array<planSchemaType & { id: number }>,
  planData: Array<planSchemaType> | null,
  uuid: string | undefined,
  setInitItems: (data: Array<planSchemaType & { id: number }>) => void,
  setItems: (data: Array<planSchemaType & { id: number }>) => void
) => {
  useEffect(() => {
    if (uuid && isEqual(initItems, []) && planData !== null) {
      // NOTE: 資金繰りで埋めて計画番号順にソート
      const tmpItems = sortBy(
        uniqBy([...planData, ...defaultPlan(uuid)], (item) => item.plan_no),
        ['plan_no']
      ).map((item) => ({ ...item, id: item.plan_no }));

      setInitItems(tmpItems);
      setItems(tmpItems);
    }
  }, [planData, uuid]);
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
  style?: CSSProperties;
  islandList?: { uuid: string; island_name: string }[];
  planData: Array<planSchemaType> | null;
  setPlanData: (data: Array<planSchemaType>) => void;
  turn?: number;
  uuid?: string;
};

export const PlanList = memo(
  function PlanList({ style, islandList, planData, setPlanData, turn = 0, uuid }: PlanListProps) {
    const [initItems, setInitItems] = useState<Array<planSchemaType & { id: number }>>([]);
    const [items, setItems] = useState<Array<planSchemaType & { id: number }>>(initItems);
    const isChange = useMemo(() => !isEqual(initItems, items), [initItems, items]);
    const islandOptions = GetIslandOptions(islandList);

    useEffectNormalizePlanData(initItems, planData, uuid, setInitItems, setItems);

    useEffect(() => {
      if (isChange) {
        const omitFinancing = items.filter((item) => item.plan !== 'financing');
        const newPlanData = omitFinancing.map((obj) => omit(obj, ['id']));
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
      setTimeout(() => setItems(changePlanNo), 0);
    };

    const setItem = (data: Omit<planSchemaType, 'from_uuid' | 'id'>) => {
      const newItems = [...items];
      newItems[data.plan_no] = { ...newItems[data.plan_no], ...data };
      const changePlanNo = newItems.map((item, index) => ({ ...item, plan_no: index }));
      setItems(changePlanNo);
    };

    return (
      <div style={style}>
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
              let tmpTurn = turn + 1;
              for (let i = 0; i < index; i++) {
                const { immediate } = getPlanDefine(items[i].plan);
                tmpTurn = immediate ? tmpTurn : tmpTurn + items[i].times;
              }
              return (
                <SortableItem
                  key={`item-${item.plan_no}`}
                  isChange={isChange}
                  islandOptions={islandOptions}
                  item={item}
                  setItem={setItem}
                  turn={tmpTurn}
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
