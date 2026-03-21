/**
 * @module MenuContent
 * @description 開発画面のメニューコンテンツコンポーネント。
 */
import type { Island, Plan, TurnLog, TurnResourceHistory, TurnState } from '@/db/kysely';
import BaseTabs from '@/global/component/TabContents';
import { MissileStatData } from '@/global/store/api/auth/missileStats';
import { PlanStatItem } from '@/global/store/api/auth/planStats';
import dynamic from 'next/dynamic';
import { Activity } from 'react';
import IslandSettingsPanel from './IslandSettingsPanel';

const PlanList = dynamic(() => import('@/global/component/PlanList'), { ssr: false });
const TurnLogComponent = dynamic(() => import('@/global/component/TurnLog'), { ssr: false });
const TurnResourceChart = dynamic(() => import('@/global/component/TurnResourceChart'), {
  ssr: false,
});
const PlanStatsTable = dynamic(() => import('@/global/component/PlanStatsTable'), { ssr: false });

type ViewMode = 'plan' | 'log' | 'history' | 'stats' | 'settings';

const VIEW_LABEL: Record<ViewMode, string> = {
  plan: '開発計画',
  log: '開発記録',
  history: '資源推移',
  stats: '統計',
  settings: '設定',
};

const TAB_CONTENTS: Array<{ label: string; value: ViewMode }> = [
  { label: '計画', value: 'plan' },
  { label: '記録', value: 'log' },
  { label: '推移', value: 'history' },
  { label: '統計', value: 'stats' },
  { label: '設定', value: 'settings' },
];

const activityMode = (view: ViewMode, target: ViewMode): 'visible' | 'hidden' =>
  view === target ? 'visible' : 'hidden';

const getIslandSettingsPanelKey = (developData?: Props['developData']) =>
  `${developData?.island_name_prefix ?? ''}:${developData?.island_name ?? ''}:${developData?.current_title_type ?? ''}`;

function MenuHeader({ developData, view }: { developData?: Props['developData']; view: ViewMode }) {
  const islandName = `${developData?.island_name_prefix ?? ''}${developData?.island_name ?? ''}`;
  const titleText = developData?.current_title_name?.trim() ?? '';

  return (
    <div className="text-bold mt-2 text-center text-3xl text-red-900">
      {`「${islandName}島」`}
      <span className="text-black">{VIEW_LABEL[view]}</span>
      {titleText !== '' ? (
        <div className="ml-2 text-xl text-cyan-800">{`[${titleText}]`}</div>
      ) : null}
      <div className="text-center text-base text-black">
        {'ミサイル保有数: '}
        <span className="font-mono text-lg font-bold text-red-900">{developData?.missile}</span>
        {'発'}
      </div>
      <hr className="my-2 border-gray-200" />
    </div>
  );
}

function MenuPanels({
  view,
  islandList,
  turnData,
  isPlanLoading,
  fetchPlanData,
  developData,
  turnLog,
  setLazyFlag,
  turnResourceHistory,
  planStats,
  missileStats,
  refreshDevelopData,
}: {
  view: ViewMode;
  islandList?: Props['islandList'];
  turnData?: Props['turnData'];
  isPlanLoading: boolean;
  fetchPlanData?: Props['fetchPlanData'];
  developData?: Props['developData'];
  turnLog?: Props['turnLog'];
  setLazyFlag: Props['setLazyFlag'];
  turnResourceHistory?: Props['turnResourceHistory'];
  planStats?: Props['planStats'];
  missileStats?: Props['missileStats'];
  refreshDevelopData: Props['refreshDevelopData'];
}) {
  return (
    <div className={'flex flex-1 flex-col overflow-hidden'}>
      <Activity mode={activityMode(view, 'plan')}>
        <PlanList
          className="flex-1 overflow-y-auto p-2"
          islandList={islandList}
          turn={turnData?.turn}
          isPlanLoading={isPlanLoading}
          initPlanData={fetchPlanData}
          uuid={developData?.uuid}
        />
      </Activity>
      <Activity mode={activityMode(view, 'log')}>
        <TurnLogComponent className="flex-1" logs={turnLog} setLazyFlag={setLazyFlag} />
      </Activity>
      <Activity mode={activityMode(view, 'history')}>
        <div className="flex-1 overflow-y-auto">
          <TurnResourceChart data={turnResourceHistory} />
        </div>
      </Activity>
      <Activity mode={activityMode(view, 'stats')}>
        <PlanStatsTable className="flex-1" data={planStats} missileStats={missileStats} />
      </Activity>
      <Activity mode={activityMode(view, 'settings')}>
        <IslandSettingsPanel
          key={getIslandSettingsPanelKey(developData)}
          currentIslandName={developData?.island_name}
          currentIslandNamePrefix={developData?.island_name_prefix}
          currentTitleType={developData?.current_title_type}
          currentTitleName={developData?.current_title_name}
          availableTitles={developData?.available_titles}
          canChangeIslandName={developData?.can_change_island_name}
          nextIslandNameChangeAt={developData?.next_island_name_change_at}
          onSaved={refreshDevelopData}
        />
      </Activity>
    </div>
  );
}

/**
 * 島開発メニューのコンテンツを表示するコンポーネント
 * '計画'と'記録'のビュー切り替えを処理
 */
type Props = {
  /** モバイルビューかどうかを示すフラグ */
  isMobile: boolean;
  /** 高さ計測用のリストコンテナのコールバックref */
  listCallback: (node: HTMLDivElement) => void;
  /** リストコンテナの高さ */
  listHeight: string;
  /** 島の開発データ */
  developData?: Island & {
    island_name: string;
    island_name_prefix: string;
    user_name?: string;
    island_name_changed_at?: number;
    rank: number;
    current_title_type?: string;
    current_title_name?: string;
    available_titles?: Array<{ type: string; name: string }>;
    can_change_island_name?: boolean;
    next_island_name_change_at?: number;
  };
  /** 現在のビューモード（'plan' | 'log' | 'history' | 'settings'） */
  view: ViewMode;
  /** 移住可能な島のリスト */
  islandList?: { uuid: string; island_name: string }[];
  /** 現在のターンデータ */
  turnData?: TurnState;
  /** 計画データ読み込み中フラグ */
  isPlanLoading: boolean;
  /** 初期計画データ */
  fetchPlanData?: Plan[];
  /** ターン記録の履歴 */
  turnLog?: (Omit<TurnLog, 'log' | 'secret_log'> & {
    log?: string;
    secret_log?: string;
  })[];
  /** 100ターン分の人口・食料・資金履歴 */
  turnResourceHistory?: Omit<TurnResourceHistory, 'uuid'>[];
  /** 計画成功統計 */
  planStats?: PlanStatItem[];
  /** ミサイル戦績統計 */
  missileStats?: MissileStatData;
  /** ログの遅延読み込みフラグを設定するコールバック */
  setLazyFlag: (flag: boolean) => void;
  /** ビューモードを変更するコールバック */
  setView: (view: ViewMode) => void;
  /** 設定保存後に開発データを再取得する */
  refreshDevelopData: () => void;
};

/**
 * 島開発用のメニューコンテンツをレンダリング
 * @param props コンポーネントのプロパティ
 * @returns レンダリングされたメニューコンテンツコンポーネント
 */
export const MenuContent = ({
  isMobile,
  listCallback,
  listHeight,
  developData,
  view,
  islandList,
  turnData,
  isPlanLoading,
  fetchPlanData,
  turnLog,
  turnResourceHistory,
  planStats,
  missileStats,
  setLazyFlag,
  setView,
  refreshDevelopData,
}: Props) => {
  const mobileCardClass = isMobile ? 'rounded-lg bg-white p-2 shadow-xl' : '';

  return (
    <div className={`flex h-full min-h-0 ${mobileCardClass}`}>
      <div
        ref={listCallback}
        className="double flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border-3 border-gray-200 bg-teal-50/50"
        style={{ height: listHeight }}
      >
        <MenuHeader developData={developData} view={view} />
        <MenuPanels
          view={view}
          islandList={islandList}
          turnData={turnData}
          isPlanLoading={isPlanLoading}
          fetchPlanData={fetchPlanData}
          developData={developData}
          turnLog={turnLog}
          setLazyFlag={setLazyFlag}
          turnResourceHistory={turnResourceHistory}
          planStats={planStats}
          missileStats={missileStats}
          refreshDevelopData={refreshDevelopData}
        />
      </div>
      <div className="-ml-[3px] flex h-full min-h-0 items-center">
        <BaseTabs
          orientation="vertical-right"
          size="sm"
          value={view}
          onChange={setView}
          tabContents={TAB_CONTENTS}
        />
      </div>
    </div>
  );
};
