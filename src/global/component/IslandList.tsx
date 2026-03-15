import { isEqual } from 'es-toolkit';
import Link from 'next/link';
import { CSSProperties, forwardRef, memo, Ref } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import META_DATA from '../define/metadata';

type IslandListItem = {
  uuid: string;
  island_name: string;
  user_name?: string;
  rank: number;
  population?: number;
  money?: number;
  food?: number;
  area?: number;
  farm?: number;
  factory?: number;
  mining?: number;
};

interface IslandListProps {
  className?: string;
  style?: CSSProperties;
  islands?: IslandListItem[];
}

const title =
  'border-1 text-[11px] md:text-xs xl:text-sm border-gray-400 bg-green-200 text-center font-semibold text-red-700';
const titleCenter = `${title} flex items-center justify-center`;
const value =
  'border-1 text-xs md:text-sm xl:text-base border-gray-400 bg-cyan-100 text-center text-shadow-xs/30';
const rankStyle =
  'flex items-center justify-center text-sm xl:text-lg text-center font-semibold text-red-900';

export default memo(
  forwardRef<VirtuosoHandle, IslandListProps>(function IslandList(
    { className, style, islands }: IslandListProps,
    ref: Ref<VirtuosoHandle>
  ) {
    const ready = islands !== undefined && islands.length > 0;
    if (!ready) return null;

    return (
      <Virtuoso
        ref={ref}
        className={className}
        style={style}
        data={islands}
        itemContent={(_index, island) => {
          const { rank, island_name, uuid, user_name, population, money, food } = island;

          return (
            <div className="my-2 rounded-sm border-1 border-gray-400 bg-white/70 p-1">
              <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-0.5">
                <div className="grid h-full min-h-12 grid-rows-[auto_1fr] gap-0.5">
                  <div className={`${titleCenter} py-0.5`}>順位</div>
                  <div className={`${rankStyle} h-full border-1 border-gray-400 bg-green-200`}>
                    {rank}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <Link
                    href={`/sight?uuid=${uuid}`}
                    className="flex min-h-12 items-center justify-center border-1 border-gray-400 bg-cyan-100 px-2 py-0.5 text-center"
                  >
                    <span className="line-clamp-1 min-w-0 text-center text-base text-lg font-semibold text-red-900">
                      {`${island_name}島`}
                    </span>
                  </Link>

                  <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-0.5">
                    <div className={titleCenter}>所有者</div>
                    <div
                      className={`flex items-center justify-center border-1 border-gray-400 bg-cyan-100 px-2 text-center text-lg text-shadow-xs/30`}
                    >
                      <span className="line-clamp-1 break-all">{user_name ?? '-'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-0.5">
                    <div className={`${titleCenter} col-span-2`}>人口</div>
                    <div className={`${titleCenter} col-span-2`}>資金 (推定)</div>
                    <div className={`${titleCenter} col-span-2`}>食糧</div>
                    <div className={`${value} col-span-2`}>
                      {population !== undefined ? `${population}人` : '-'}
                    </div>
                    <div className={`${value} col-span-2`}>
                      {money !== undefined ? `${money}${META_DATA.UNIT_MONEY}` : '-'}
                    </div>
                    <div className={`${value} col-span-2`}>
                      {food !== undefined ? `${food}${META_DATA.UNIT_FOOD}` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      />
    );
  }),
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
