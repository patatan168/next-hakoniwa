import type { Island, Plan, TurnLog, TurnState } from '@/db/kysely';
import BaseTabs from '@/global/component/TabContents';
import dynamic from 'next/dynamic';
import { Activity } from 'react';

const PlanList = dynamic(() => import('@/global/component/PlanList'), { ssr: false });
const TurnLogComponent = dynamic(() => import('@/global/component/TurnLog'), { ssr: false });

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
  developData?: Island & { island_name: string } & { rank: number };
  /** 現在のビューモード（'plan' または 'log'） */
  view: 'plan' | 'log';
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
  /** ログの遅延読み込みフラグを設定するコールバック */
  setLazyFlag: (flag: boolean) => void;
  /** ビューモードを変更するコールバック */
  setView: (view: 'plan' | 'log') => void;
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
  setLazyFlag,
  setView,
}: Props) => {
  return (
    <div className={`flex h-full ${isMobile ? 'rounded-lg bg-white p-2 shadow-xl' : ''}`}>
      <div
        ref={listCallback}
        className="double flex flex-1 flex-col overflow-hidden rounded-lg border-3 border-gray-200 bg-teal-50/50"
        style={{ height: listHeight }}
      >
        <div className="text-bold mt-2 text-center text-3xl text-red-900">
          {`「${developData?.island_name || ''}島」`}
          <span className="text-black">{view === 'plan' ? '開発計画' : '開発記録'}</span>
          <div className="text-center text-base text-black">
            {'ミサイル保有数: '}
            <span className="font-mono text-lg font-bold text-red-900">{developData?.missile}</span>
            {'発'}
          </div>
          <hr className="my-2 border-gray-200" />
        </div>
        <div className={'flex flex-1 flex-col overflow-hidden'}>
          <Activity mode={view === 'plan' ? 'visible' : 'hidden'}>
            <PlanList
              className="flex-1 overflow-y-auto p-2"
              islandList={islandList}
              turn={turnData?.turn}
              isPlanLoading={isPlanLoading}
              initPlanData={fetchPlanData}
              uuid={developData?.uuid}
            />
          </Activity>
          <Activity mode={view === 'log' ? 'visible' : 'hidden'}>
            <TurnLogComponent className="flex-1" logs={turnLog} setLazyFlag={setLazyFlag} />
          </Activity>
        </div>
      </div>
      <div className="-ml-[3px] flex h-full items-center">
        <BaseTabs
          orientation="vertical-right"
          value={view}
          onChange={setView}
          tabContents={[
            { label: '計画', value: 'plan' },
            { label: '記録', value: 'log' },
          ]}
        />
      </div>
    </div>
  );
};
