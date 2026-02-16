'use client';
import IslandData from '@/global/component/IslandData';
import BaseTabs from '@/global/component/TabContents';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useWindowSize } from '@/global/function/useWindowSize';
import { developmentStore } from '@/global/store/api/auth/development';
import { planStore } from '@/global/store/api/auth/plan';
import { turnLogAuthStore } from '@/global/store/api/auth/turnLog';
import { islandListStore } from '@/global/store/api/public/islandList';
import { turnStore } from '@/global/store/api/public/turn';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), { ssr: false });
const PlanList = dynamic(() => import('@/global/component/PlanList'), { ssr: false });
const TurnLog = dynamic(() => import('@/global/component/TurnLog'), { ssr: false });

export default function IslandList() {
  const {
    data: developData,
    fetchIfNeeded: fetchDev,
    isLoading,
  } = useClientFetch(developmentStore);
  const { data: turnData, fetchIfNeeded: fetchTurn } = useClientFetch(turnStore);
  const {
    data: fetchPlanData,
    isLoading: isPlanLoading,
    fetchIfNeeded: fetchPlan,
  } = useClientFetch(planStore);
  const { data: islandList, fetchIfNeeded: fetchIslandList } = useClientFetch(islandListStore);
  const { data: turnLog, fetchIfNeeded: fetchTurnLog } = useClientFetch(turnLogAuthStore);
  const [view, setView] = useState<'plan' | 'log'>('plan');
  const [lazyFlag, setLazyFlag] = useState(false);
  const [listHeight, setListHeight] = useState('100svh');
  const [mapSize, setMapSize] = useState('min(var(--real-vw), var(--real-vh-minus-footer))');
  const { width, minusFooterHeight } = useWindowSize();
  const mapCallback = useCallback(
    (node: HTMLDivElement) => {
      if (node !== null) {
        const { x, y } = node.getBoundingClientRect();
        setMapSize(`min(${width - x}px, ${minusFooterHeight - y}px)`);
      }
    },
    [width, minusFooterHeight]
  );
  const listCallback = useCallback(
    (node: HTMLDivElement) => {
      if (node !== null) {
        const { y } = node.getBoundingClientRect();
        setListHeight(`${minusFooterHeight - y}px`);
      }
    },
    [minusFooterHeight]
  );

  useEffect(() => {
    fetchDev({ method: 'GET' });
    fetchTurn({ method: 'GET' });
    fetchPlan({ method: 'GET' });
    fetchIslandList({ method: 'GET' });
  }, []);

  useEffect(() => {
    if (view === 'log') {
      const lastLogUuid =
        turnLog.get && turnLog.get.length > 0
          ? turnLog.get[turnLog.get.length - 1].log_uuid
          : undefined;
      fetchTurnLog({ method: 'GET' }, { query: lastLogUuid ? `log_uuid=${lastLogUuid}` : '' });
    }
  }, [view, lazyFlag]);

  return (
    <>
      <div className="grid grid-cols-[auto_1fr_auto] gap-2">
        <div className="grid justify-items-center">
          <IslandData mode="development" data={developData.get} />
          <HakoniwaMap
            ref={mapCallback}
            style={{ width: mapSize, height: 'auto', maxHeight: mapSize }}
            isLoading={isLoading.get}
            islandName={developData.get?.island_name}
            data={developData.get?.island_info}
            isDevelop={true}
            uuid={developData.get?.uuid}
          />
        </div>
        <div>
          {view === 'plan' ? (
            <PlanList
              className="overflow-y-auto"
              ref={listCallback}
              style={{ height: listHeight }}
              islandList={islandList.get}
              turn={turnData.get?.turn}
              isPlanLoading={isPlanLoading.get}
              initPlanData={fetchPlanData.get}
              uuid={developData.get?.uuid}
            />
          ) : (
            <>
              <div className="text-bold mb-4 text-center text-3xl text-red-900">
                {`「${developData.get?.island_name}島」`}
                <span className="text-black">開発記録</span>
              </div>
              <TurnLog
                ref={listCallback}
                style={{ height: listHeight }}
                logs={turnLog.get}
                setLazyFlag={setLazyFlag}
              />
            </>
          )}
        </div>
        <div className="flex h-full items-center">
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
    </>
  );
}
