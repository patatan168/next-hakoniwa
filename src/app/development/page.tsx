'use client';
import { useFetch } from '@/global/function/fetch';
import dynamic from 'next/dynamic';

const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), {
  ssr: true,
});

const SelectPlan = dynamic(() => import('@/app/development/SelectPlan'));

export default function IslandList() {
  const { data, isLoading } = useFetch('/api/auth/development', { method: 'GET' });

  return (
    <>
      <HakoniwaMap isLoading={isLoading} islandName={data?.island_name} data={data?.island_info} />
      <SelectPlan />
    </>
  );
}
