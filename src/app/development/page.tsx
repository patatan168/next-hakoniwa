'use client';
import { planSchemaType } from '@/db/schema/planTable';
import { Card } from '@/global/component/Card';
import { PlanList } from '@/global/component/PlanList';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { developmentStore } from '@/global/store/api/auth/development';
import { planStore } from '@/global/store/api/auth/plan';
import { islandListStore } from '@/global/store/api/public/islandList';
import { turnStore } from '@/global/store/api/public/turn';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';

const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), {
  ssr: true,
});

const SelectPlan = dynamic(() => import('@/app/development/SelectPlan'));

export default function IslandList() {
  const {
    data: developData,
    fetchIfNeeded: fetchDev,
    isLoading,
  } = useClientFetch(developmentStore);
  const { data: turnData, fetchIfNeeded: fetchTurn } = useClientFetch(turnStore);
  const { data: fetchPlanData, fetchIfNeeded: fetchPlan } = useClientFetch(planStore);
  const { data: islandList, fetchIfNeeded: fetchIslandList } = useClientFetch(islandListStore);
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
          uuid={developData.get?.uuid}
        />
      </div>
    </>
  );
}
