import { islandSchemaType } from '@/db/schema/islandTable';
import { planSchemaType } from '@/db/schema/planTable';
import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import BaseTabs from '@/global/component/TabContents';
import dynamic from 'next/dynamic';

const PlanList = dynamic(() => import('@/global/component/PlanList'), { ssr: false });
const TurnLog = dynamic(() => import('@/global/component/TurnLog'), { ssr: false });

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
  developData?: islandSchemaType & { island_name: string } & { rank: number };
  /** 現在のビューモード（'plan' または 'log'） */
  view: 'plan' | 'log';
  /** 移住可能な島のリスト */
  islandList?: { uuid: string; island_name: string }[];
  /** 現在のターンデータ */
  turnData?: turnLogSchemaType;
  /** 計画データ読み込み中フラグ */
  isPlanLoading: boolean;
  /** 初期計画データ */
  fetchPlanData?: planSchemaType[];
  /** ターン記録の履歴 */
  turnLog?: (Omit<turnLogSchemaType, 'log' | 'secret_log'> & {
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
        className="double flex flex-1 flex-col overflow-hidden border-3 border-green-300 bg-teal-50/50 p-2"
        style={{ height: listHeight }}
      >
        <div className="text-bold mb-4 text-center text-3xl text-red-900">
          {`「${developData?.island_name}島」`}
          <span className="text-black">{view === 'plan' ? '開発計画' : '開発記録'}</span>
        </div>
        {view === 'plan' ? (
          <PlanList
            className="flex-1 overflow-y-auto"
            islandList={islandList}
            turn={turnData?.turn}
            isPlanLoading={isPlanLoading}
            initPlanData={fetchPlanData}
            uuid={developData?.uuid}
          />
        ) : (
          <TurnLog className="flex-1" logs={turnLog} setLazyFlag={setLazyFlag} />
        )}
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
