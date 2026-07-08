/**
 * @module IslandList
 * @description 島一覧の仮想スクロールリストコンポーネント。
 */
import { isEqual } from '@/global/function/collection';
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
  last_login_at?: number;
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
    const nowUnixTime = Math.floor(Date.now() / 1000);

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
            last_login_at,
          } = island;
          const displayIslandName = `${island_name_prefix ?? ''}${island_name}島`;
          const titleName =
            current_title_name && current_title_name.trim() !== '' ? current_title_name : '-';
          const userName = user_name && user_name.trim() !== '' ? user_name : '-';
          const neglectDays = last_login_at
            ? Math.floor((nowUnixTime - last_login_at) / (60 * 60 * 24))
            : 0;
          const displayNeglectDays = last_login_at ? `${neglectDays}` : '-';

          // 放置日数が80%以上の場合は赤文字にする。島名はグレーアウト。
          const isNeglectAlert = neglectDays / META_DATA.NEGLECT_DAYS >= 0.8;
          const neglectDayColor = isNeglectAlert ? 'text-red-600' : '';
          const neglectMaxDayColor = isNeglectAlert ? '' : 'text-slate-400';
          const displayIslandNameColor = isNeglectAlert ? 'text-slate-500' : 'text-red-900';

          // 人口、資金、食料の表示を整形
          const displayPopulation = population !== undefined ? `${population}人` : '-';
          const displayMoney = money !== undefined ? `${money}${META_DATA.UNIT_MONEY}` : '-';
          const displayFood = food !== undefined ? `${food}${META_DATA.UNIT_FOOD}` : '-';

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
                    <span
                      className={`line-clamp-1 min-w-0 text-center text-base text-lg font-semibold ${displayIslandNameColor}`}
                    >
                      {displayIslandName}
                    </span>
                  </Link>

                  <div className="space-y-0.5 md:hidden">
                    <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-0.5">
                      <div className={titleCenter}>放置日数</div>
                      <div className={`${value} flex items-center justify-center px-2`}>
                        <span
                          className={`line-clamp-1 break-all ${neglectDayColor}`}
                        >{`${displayNeglectDays}`}</span>
                        <span
                          className={`line-clamp-1 break-all ${neglectMaxDayColor}`}
                        >{`\u2002/\u2002${META_DATA.NEGLECT_DAYS}\u2002`}</span>
                        <span className="line-clamp-1 break-all">日</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-0.5">
                      <div className={titleCenter}>所有者</div>
                      <div className={`${value} flex items-center justify-center px-2`}>
                        <span className="line-clamp-1 break-all">{userName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-0.5">
                      <div className={titleCenter}>称号</div>
                      <div className={`${value} flex items-center justify-center px-2`}>
                        <span className="line-clamp-1 break-all">{titleName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-0.5">
                      <div className={`${titleCenter} col-span-2`}>人口</div>
                      <div className={`${titleCenter} col-span-2`}>資金 (推定)</div>
                      <div className={`${titleCenter} col-span-2`}>食料</div>
                      <div className={`${value} col-span-2`}>{displayPopulation}</div>
                      <div className={`${value} col-span-2`}>{displayMoney}</div>
                      <div className={`${value} col-span-2`}>{displayFood}</div>
                    </div>
                  </div>

                  <div className="hidden md:grid md:grid-cols-[4rem_minmax(0,1fr)_4rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-0.5">
                    <Link
                      href={`/sight?uuid=${uuid}`}
                      className="col-span-4 flex min-h-12 items-center justify-center border-1 border-gray-400 bg-cyan-100 px-2 py-0.5 text-center"
                    >
                      <span
                        className={`line-clamp-1 min-w-0 text-center text-base text-lg font-semibold ${displayIslandNameColor}`}
                      >
                        {displayIslandName}
                      </span>
                    </Link>
                    <div className="row-span-3 grid grid-rows-[auto_1fr] gap-0.5">
                      <div className={`${titleCenter} self-start`}>人口</div>
                      <div className={`${value} flex items-center justify-center`}>
                        {displayPopulation}
                      </div>
                    </div>
                    <div className="row-span-3 grid grid-rows-[auto_1fr] gap-0.5">
                      <div className={`${titleCenter} self-start`}>資金 (推定)</div>
                      <div className={`${value} flex items-center justify-center`}>
                        {displayMoney}
                      </div>
                    </div>
                    <div className="row-span-3 grid grid-rows-[auto_1fr] gap-0.5">
                      <div className={`${titleCenter} self-start`}>食料</div>
                      <div className={`${value} flex items-center justify-center`}>
                        {displayFood}
                      </div>
                    </div>
                    <div className={titleCenter}>放置日数</div>
                    <div className={`${value} flex items-center justify-center px-2`}>
                      <span
                        className={`line-clamp-1 break-all ${neglectDayColor}`}
                      >{`${displayNeglectDays}`}</span>
                      <span
                        className={`line-clamp-1 break-all ${neglectMaxDayColor}`}
                      >{`\u2002/\u2002${META_DATA.NEGLECT_DAYS}\u2002`}</span>
                      <span className="line-clamp-1">日</span>
                    </div>
                    <div className={titleCenter}>所有者</div>
                    <div className={`${value} flex items-center justify-center px-2`}>
                      <span className="line-clamp-1 break-all">{userName}</span>
                    </div>
                    <div className={titleCenter}>称号</div>
                    <div className={`${value} col-span-3 flex items-center justify-center px-2`}>
                      <span className="line-clamp-1 break-all">{titleName}</span>
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
