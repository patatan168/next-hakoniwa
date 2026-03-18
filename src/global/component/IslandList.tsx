/**
 * @module IslandList
 * @description 島一覧の仮想スクロールリストコンポーネント。
 */
import { isEqual } from 'es-toolkit';
import Link from 'next/link';
import { CSSProperties, forwardRef, memo, Ref } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import META_DATA from '../define/metadata';

type IslandListItem = {
  uuid: string;
  island_name_prefix?: string;
  island_name: string;
  user_name?: string;
  current_title_name?: string;
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

    if (islands !== undefined && islands.length === 0) {
      return (
        <div className={`p-4 text-center text-gray-500 ${className ?? ''}`}>
          島がまだ存在しません。
        </div>
      );
    }

    if (!ready) return null;

    return (
      <Virtuoso
        ref={ref}
        className={className}
        style={style}
        data={islands}
        itemContent={(_index, island) => {
          const {
            rank,
            island_name_prefix,
            island_name,
            uuid,
            user_name,
            current_title_name,
            population,
            money,
            food,
          } = island;
          const displayIslandName = `${island_name_prefix ?? ''}${island_name}島`;

          return (
            <div className="mb-2 rounded-sm border-1 border-gray-400 bg-white/70 p-1">
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
                    className="flex min-h-12 items-center justify-center border-1 border-gray-400 bg-cyan-100 px-2 py-0.5 text-center md:hidden"
                  >
                    <span className="line-clamp-1 min-w-0 text-center text-base text-lg font-semibold text-red-900">
                      {displayIslandName}
                    </span>
                  </Link>

                  <div className="space-y-0.5 md:hidden">
                    <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-0.5">
                      <div className={titleCenter}>所有者</div>
                      <div className={`${value} flex items-center justify-center px-2`}>
                        <span className="line-clamp-1 break-all">{user_name ?? '-'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-0.5">
                      <div className={titleCenter}>称号</div>
                      <div className={`${value} flex items-center justify-center px-2`}>
                        <span className="line-clamp-1 break-all">
                          {current_title_name && current_title_name.trim() !== ''
                            ? current_title_name
                            : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-0.5">
                      <div className={`${titleCenter} col-span-2`}>人口</div>
                      <div className={`${titleCenter} col-span-2`}>資金 (推定)</div>
                      <div className={`${titleCenter} col-span-2`}>食料</div>
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

                  <div className="hidden md:grid md:grid-cols-[4rem_minmax(0,1fr)_4rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-0.5">
                    <Link
                      href={`/sight?uuid=${uuid}`}
                      className="col-span-4 flex min-h-12 items-center justify-center border-1 border-gray-400 bg-cyan-100 px-2 py-0.5 text-center"
                    >
                      <span className="line-clamp-1 min-w-0 text-center text-base text-lg font-semibold text-red-900">
                        {displayIslandName}
                      </span>
                    </Link>
                    <div className="row-span-2 grid grid-rows-[auto_1fr] gap-0.5">
                      <div className={`${titleCenter} self-start`}>人口</div>
                      <div className={`${value} flex items-center justify-center`}>
                        {population !== undefined ? `${population}人` : '-'}
                      </div>
                    </div>
                    <div className="row-span-2 grid grid-rows-[auto_1fr] gap-0.5">
                      <div className={`${titleCenter} self-start`}>資金 (推定)</div>
                      <div className={`${value} flex items-center justify-center`}>
                        {money !== undefined ? `${money}${META_DATA.UNIT_MONEY}` : '-'}
                      </div>
                    </div>
                    <div className="row-span-2 grid grid-rows-[auto_1fr] gap-0.5">
                      <div className={`${titleCenter} self-start`}>食料</div>
                      <div className={`${value} flex items-center justify-center`}>
                        {food !== undefined ? `${food}${META_DATA.UNIT_FOOD}` : '-'}
                      </div>
                    </div>

                    <div className={titleCenter}>所有者</div>
                    <div className={`${value} flex items-center justify-center px-2`}>
                      <span className="line-clamp-1 break-all">{user_name ?? '-'}</span>
                    </div>
                    <div className={titleCenter}>称号</div>
                    <div className={`${value} flex items-center justify-center px-2`}>
                      <span className="line-clamp-1 break-all">
                        {current_title_name && current_title_name.trim() !== ''
                          ? current_title_name
                          : '-'}
                      </span>
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
