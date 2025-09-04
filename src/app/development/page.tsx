'use client';
import { planSchemaType } from '@/db/schema/planTable';
import Button from '@/global/component/Button';
import HakoniwaMap from '@/global/component/HakoniwaMap';
import { PlanList } from '@/global/component/PlanList';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useWindowSize } from '@/global/function/useWindowSize';
import { developmentStore } from '@/global/store/api/auth/development';
import { planStore } from '@/global/store/api/auth/plan';
import { islandListStore } from '@/global/store/api/public/islandList';
import { turnStore } from '@/global/store/api/public/turn';
import { useCallback, useEffect, useState } from 'react';

const POST_HEADER = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

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
  const [planData, setPlanData] = useState<Array<planSchemaType> | null>(null);
  const [listHeight, setListHeight] = useState('100svh');
  const [mapSize, setMapSize] = useState('min(100vw, 100vh)');
  const [width, height] = useWindowSize();
  const { fetch: trigger } = useClientFetch(planStore);
  const listCallback = useCallback(
    (node: HTMLDivElement) => {
      if (node !== null) {
        const { x, y } = node.getBoundingClientRect();
        setListHeight(`${height - y}px`);
        setMapSize(`min(${width - x}px, ${height}px)`);
      }
    },
    [width, height]
  );

  useEffect(() => {
    if (fetchPlanData.get) setPlanData(fetchPlanData.get);
  }, [fetchPlanData.get]);

  useEffect(() => {
    fetchDev({ method: 'GET' });
    fetchTurn({ method: 'GET' });
    fetchPlan({ method: 'GET' });
    fetchIslandList({ method: 'GET' });
  });

  return (
    <>
      <div className="grid gap-x-4" style={{ gridTemplateColumns: 'auto 1fr' }}>
        <HakoniwaMap
          style={{ width: mapSize, height: mapSize }}
          isLoading={isLoading.get}
          islandName={developData.get?.island_name}
          data={developData.get?.island_info}
        />
        <div>
          <Button
            type="submit"
            onClick={() => trigger({ ...POST_HEADER, body: JSON.stringify(planData) })}
            disabled={!planData || planData.length === 0 || isLoading.get}
          >
            計画送信
          </Button>
          <PlanList
            className="overflow-y-auto"
            ref={listCallback}
            style={{ height: listHeight }}
            islandList={islandList.get}
            turn={turnData.get?.turn}
            isPlanLoading={isPlanLoading.get}
            planData={planData}
            setPlanData={setPlanData}
            uuid={developData.get?.uuid}
          />
        </div>
      </div>
    </>
  );
}
