'use client';
import { planSchemaType } from '@/db/schema/planTable';
import Button from '@/global/component/Button';
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
  const { fetch: trigger } = useClientFetch(planStore);
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
        <ul>
          <li>
            <Button
              type="submit"
              onClick={() => trigger({ ...POST_HEADER, body: JSON.stringify(planData) })}
              disabled={!planData || planData.length === 0 || isLoading.get}
            >
              計画送信
            </Button>
          </li>
          <li>
            <PlanList
              style={{ height: listHeight }}
              islandList={islandList.get}
              turn={turnData.get?.turn}
              isPlanLoading={isPlanLoading.get}
              planData={planData}
              setPlanData={setPlanData}
              uuid={developData.get?.uuid}
            />
          </li>
        </ul>
      </div>
    </>
  );
}
