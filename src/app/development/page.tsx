'use client';
import { islandSchemaType } from '@/db/schema/islandTable';
import { planSchemaType } from '@/db/schema/planTable';
import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { userSchemaType } from '@/db/schema/userTable';
import { Card } from '@/global/component/Card';
import { PlanList } from '@/global/component/PlanList';
import { useFetch } from '@/global/function/fetch';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';

const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), {
  ssr: true,
});

const SelectPlan = dynamic(() => import('@/app/development/SelectPlan'));

export default function IslandList() {
  const { data: developData, isLoading } = useFetch<
    islandSchemaType & Pick<userSchemaType, 'island_name'>
  >('/api/auth/development', { method: 'GET' });
  const { data: turnData } = useFetch<turnLogSchemaType>('/api/public/turn', { method: 'GET' });
  const { data: fetchPlanData } = useFetch<Array<planSchemaType>>('/api/auth/plan', {
    method: 'GET',
  });
  const { data: uuidData } = useFetch<{ uuid: string }>('/api/auth/session', {
    method: 'GET',
  });
  const { data: islandList } = useFetch<{ uuid: string; island_name: string }[]>(
    '/api/public/islandList',
    {
      method: 'GET',
    }
  );
  const [planData, setPlanData] = useState<Array<planSchemaType>>([]);
  const [listHeight, setListHeight] = useState('100svh');
  const listCallback = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      const { y } = node.getBoundingClientRect();
      setListHeight(`calc(100svh - ${y}px)`);
    }
  }, []);

  useEffect(() => {
    if (fetchPlanData) setPlanData(fetchPlanData);
  }, [fetchPlanData]);

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
            isLoading={isLoading}
            islandName={developData?.island_name}
            data={developData?.island_info}
          />
        </Card>
        <PlanList
          style={{ height: listHeight }}
          islandList={islandList}
          turn={turnData?.turn}
          planData={planData}
          setPlanData={setPlanData}
          uuid={uuidData?.uuid}
        />
      </div>
    </>
  );
}
