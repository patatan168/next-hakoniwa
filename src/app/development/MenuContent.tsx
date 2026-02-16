import { islandSchemaType } from '@/db/schema/islandTable';
import { planSchemaType } from '@/db/schema/planTable';
import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import BaseTabs from '@/global/component/TabContents';
import dynamic from 'next/dynamic';

const PlanList = dynamic(() => import('@/global/component/PlanList'), { ssr: false });
const TurnLog = dynamic(() => import('@/global/component/TurnLog'), { ssr: false });

type Props = {
  isMobile: boolean;
  listCallback: (node: HTMLDivElement) => void;
  listHeight: string;
  developData?: islandSchemaType & { island_name: string } & { rank: number };
  view: 'plan' | 'log';
  islandList?: { uuid: string; island_name: string }[];
  turnData?: turnLogSchemaType;
  isPlanLoading: boolean;
  fetchPlanData?: planSchemaType[];
  turnLog?: (Omit<turnLogSchemaType, 'log' | 'secret_log'> & {
    log?: string;
    secret_log?: string;
  })[];
  setLazyFlag: (flag: boolean) => void;
  setView: (view: 'plan' | 'log') => void;
};

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
        style={{ height: isMobile ? '100%' : listHeight }}
      >
        <div className="text-bold mb-4 text-center text-3xl text-red-900">
          {`「${developData?.island_name}島」`}
          <span className="text-black">{view === 'plan' ? '開発計画' : '開発記録'}</span>
        </div>
        {view === 'plan' ? (
          <PlanList
            className="flex-1 overflow-y-auto"
            style={{ height: '100%' }}
            islandList={islandList}
            turn={turnData?.turn}
            isPlanLoading={isPlanLoading}
            initPlanData={fetchPlanData}
            uuid={developData?.uuid}
          />
        ) : (
          <TurnLog
            className="flex-1"
            style={{ height: '100%' }}
            logs={turnLog}
            setLazyFlag={setLazyFlag}
          />
        )}
      </div>
      <div className="-ml-[4px] flex h-full items-center">
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
