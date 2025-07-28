'use client';
import { planSchemaType } from '@/db/schema/planTable';
import { Card } from '@/global/component/Card';
import { PlanList } from '@/global/component/PlanList';
import { useFetchDevelopment } from '@/global/store/api/auth/development';
import { useFetchPlan } from '@/global/store/api/auth/plan';
import { useFetchSession } from '@/global/store/api/auth/session';
import { useFetchIslandList } from '@/global/store/api/public/islandList';
import { useFetchTurn } from '@/global/store/api/public/turn';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';

const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), {
  ssr: true,
});

const SelectPlan = dynamic(() => import('@/app/development/SelectPlan'));

export default function IslandList() {
  const { data: developData, fetchIfNeeded: fetchDev, isLoading } = useFetchDevelopment();
  const { data: turnData, fetchIfNeeded: fetchTurn } = useFetchTurn();
  const { data: fetchPlanData, fetchIfNeeded: fetchPlan } = useFetchPlan();
  const { data: uuidData, fetchIfNeeded: fetchSession } = useFetchSession();
  const { data: islandList, fetchIfNeeded: fetchIslandList } = useFetchIslandList();
  const [planData, setPlanData] = useState<Array<planSchemaType>>([]);
  const [listHeight, setListHeight] = useState('100svh');
  const listCallback = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      const { y } = node.getBoundingClientRect();
      setListHeight(`calc(100svh - ${y}px)`);
    }
  }, []);

  useEffect(() => {
    if (fetchPlanData.get) setPlanData(fetchPlanData.get);
  }, [fetchPlanData.get]);

  useEffect(() => {
    fetchDev({ method: 'GET' });
    fetchTurn({ method: 'GET' });
    fetchPlan({ method: 'GET' });
    fetchSession({ method: 'GET' });
    fetchIslandList({ method: 'GET' });
  });

  return (
    <>
      <div ref={listCallback} className="flex">
        <SelectPlan />
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'start',
            alignItems: 'center',
            width: 'fit-content',
          }}
        >
          <HakoniwaMap
            isLoading={isLoading.get}
            islandName={developData.get?.island_name}
            data={developData.get?.island_info}
          />
        </Card>
        <PlanList
          style={{ height: listHeight }}
          islandList={islandList.get}
          turn={turnData.get?.turn}
          planData={planData}
          setPlanData={setPlanData}
          uuid={uuidData.get?.uuid}
        />
      </div>
    </>
  );
}
