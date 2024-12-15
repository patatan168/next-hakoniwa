'use client';
import HakoniwaMap from '@/global/component/HakoniwaMap';
import { useFetch } from '@/global/function/fetch';

export default function IslandList() {
  const { data } = useFetch('/api/auth/development', { method: 'GET' });

  return (
    <>
      {data !== undefined && <HakoniwaMap islandName={data.island_name} data={data.island_info} />}
    </>
  );
}
