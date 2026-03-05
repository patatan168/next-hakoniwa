import { zodResolver } from '@hookform/resolvers/zod';
import { isEqual, omit } from 'es-toolkit';
import { forwardRef, memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { IoTrash } from 'react-icons/io5';
import { RxDragHandleVertical } from 'react-icons/rx';
import META_DATA from '../define/metadata';
import { getPlanDefine, getPlanSelect } from '../define/planType';
import { planInfoZod, planInfoZodValid } from '../valid/planInfo';
import { PlanItemProps } from './PlanList.types';
import { RangeSliderRHF } from './RangeSliderRHF';
import { SelectRHF } from './SelectRHF';
import Tooltip from './Tooltip';

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
      const { name, description, immediate, otherIsland, maxTimes } = getPlanDefine(plan);

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
                  <Tooltip
                    position="bottom"
                    tooltipComp={
                      <p className="max-w-sm min-w-64 text-left text-sm whitespace-pre-wrap md:text-base">
                        {description}
                      </p>
                    }
                  >
                    <SelectRHF
                      name="plan"
                      control={control}
                      id={`plan-${item.id}`}
                      options={getPlanSelect()}
                      isBottomSpace={false}
                      className="w-full flex-1"
                    />
                  </Tooltip>
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
              <Tooltip
                position="bottom"
                tooltipComp={
                  <p className="max-w-sm min-w-64 text-left text-sm whitespace-pre-wrap md:text-base">
                    {description}
                  </p>
                }
              >
                <span
                  className={`ml-2 text-sm font-medium text-shadow-xs/30 md:text-xl ${immediate ? 'text-sky-500' : 'text-amber-500'}`}
                >
                  {name}
                </span>
              </Tooltip>
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

export default PlanItem;
