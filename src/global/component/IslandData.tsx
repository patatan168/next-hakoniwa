import { islandSchemaType } from '@/db/schema/islandTable';
import { isEqual } from 'es-toolkit';
import { forwardRef, memo } from 'react';
import META_DATA from '../define/metadata';

interface IslandDataProps {
  mode: 'sight' | 'development';
  data?: Omit<islandSchemaType, 'island_info, island_name'> & { rank: number };
}

const title =
  'border-1 text-xs sm:text-base border-gray-400 bg-green-200 text-center font-semibold text-red-700';
const value =
  'border-1 text-xs sm:text-base border-gray-400 bg-cyan-100 text-center text-shadow-xs/30';
const rankStyle =
  'flex items-center text-xl justify-center border-1 border-gray-400 bg-green-200 text-center font-semibold text-red-900';

export default memo(
  forwardRef<HTMLDivElement, IslandDataProps>(function IslandData(
    IslandDataProps: IslandDataProps,
    ref
  ) {
    if (!IslandDataProps.data) return null;

    const { rank, population, money, food, area, farm, factory, mining } = IslandDataProps.data;
    return (
      <div ref={ref} className="my-2 grid w-[98vw] max-w-3xl grid-cols-9 items-stretch gap-0.5">
        {/* 順位 */}
        <div className={`${title} col-start-1 row-start-1`}>順位</div>
        <div className={`${rankStyle} col-start-1 row-span-4 row-start-2`}>
          <div>{rank}</div>
        </div>
        {/* 人口 */}
        <div className={`${title} col-span-2 col-start-2 row-start-1`}>人口</div>
        <div className={`${value} col-span-2 col-start-2 row-start-2`}>{`${population}人`}</div>
        {/* 資金 */}
        <div className={`${title} col-span-2 col-start-4 row-start-1`}>資金</div>
        <div
          className={`${value} col-span-2 col-start-4 row-start-2`}
        >{`${IslandDataProps.mode === 'sight' ? '推定' : ''}${money}${META_DATA.UNIT_MONEY}`}</div>
        {/* 食糧 */}
        <div className={`${title} col-span-2 col-start-6 row-start-1`}>食糧</div>
        <div
          className={`${value} col-span-2 col-start-6 row-start-2`}
        >{`${food}${META_DATA.UNIT_FOOD}`}</div>
        {/* 面積 */}
        <div className={`${title} col-span-2 col-start-8 row-start-1`}>面積</div>
        <div
          className={`${value} col-span-2 col-start-8 row-start-2`}
        >{`${area}${META_DATA.UNIT_AREA}`}</div>
        {/* 失業率 */}
        <div className={`${title} col-span-2 col-start-2 row-start-3`}>失業率</div>
        <div
          className={`${value} col-span-2 col-start-2 row-start-4`}
        >{`${Math.max(population / (population - farm - factory - mining), 0) * 100}%`}</div>
        {/* 農場規模 */}
        <div className={`${title} col-span-2 col-start-4 row-start-3`}>農場規模</div>
        <div className={`${value} col-span-2 col-start-4 row-start-4`}>{`${farm}人`}</div>
        {/* 工場規模 */}
        <div className={`${title} col-span-2 col-start-6 row-start-3`}>工場規模</div>
        <div className={`${value} col-span-2 col-start-6 row-start-4`}>{`${factory}人`}</div>
        {/* 採掘場規模 */}
        <div className={`${title} col-span-2 col-start-8 row-start-3`}>採掘場規模</div>
        <div className={`${value} col-span-2 col-start-8 row-start-4`}>{`${mining}人`}</div>
      </div>
    );
  }),
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
