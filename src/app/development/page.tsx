'use client';
import HakoniwaMap from '@/global/component/HakoniwaMap';
import { useFetch } from '@/global/function/fetch';

export default function IslandList() {
  const { data, isLoading } = useFetch('/api/auth/development', { method: 'GET' });

  return (
    <>
      {data !== undefined && (
        <HakoniwaMap isLoading={isLoading} islandName={data.island_name} data={data.island_info} />
      )}
    </>
  );
}
