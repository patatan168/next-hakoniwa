import { planSchemaType } from '@/db/schema/planTable';
import { Active, closestCenter, DndContext, DraggableAttributes, Over } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Ref, useState } from 'react';

type planItemProps = {
  isChange: boolean;
  item: planSchemaType;
  turn: number;
  setActivator: Ref<HTMLDivElement> | undefined;
  isDragging: boolean;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
};

const PlanItem = ({
  isChange,
  item,
  turn,
  setActivator,
  isDragging,
  attributes,
  listeners,
}: planItemProps) => {
  const { plan_no, x, y } = item;
  return (
    <div
      ref={setActivator}
      className={isChange ? 'bg-indigo-200' : 'bg-green-300'}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, min-content)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      <span className="text-gray-400">
        <b>::</b>
      </span>
      <span>{plan_no}</span>
      <span>{`(T${turn})`}</span>
      <span>{`(${x},${y})`}</span>
    </div>
  );
};

type sortedItemProps = {
  isChange: boolean;
  item: planSchemaType & { id: number };
  turn: number;
};

const SortableItem = ({ isChange, item, turn }: sortedItemProps) => {
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
        item={item}
        turn={turn}
        setActivator={setActivatorNodeRef}
        isDragging={isDragging}
        attributes={attributes}
        listeners={listeners}
      />
    </div>
  );
};

type PlanListProps = {
  planData: Array<planSchemaType>;
  turn: number;
};

export const PlanList = ({ planData, turn }: PlanListProps) => {
  const initItems = planData.map((item) => ({ ...item, id: item.plan_no }));
  const [items, setItems] = useState(initItems);
  const isChange = initItems !== items;

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

  return (
    <div>
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
          {items.map((item) => (
            <SortableItem key={item.plan_no} isChange={isChange} item={item} turn={turn} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
