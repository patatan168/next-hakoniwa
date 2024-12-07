'use client';
import { islandSchemaType } from '@/db/schema/islandTable';
import HakoniwaMap from '@/global/component/HakoniwaMap';
import { useFetch } from '@/global/function/fetch';
import { useEffect, useState } from 'react';

export default function IslandList() {
  const [island, setIsland] = useState<islandSchemaType>();
  const { data } = useFetch('/api/auth/development', { method: 'GET' });

  useEffect(() => {
    if (data !== undefined) {
      console.warn(data);
      setIsland(data);
    }
  }, [data]);

  return (
    <>
      {island !== undefined && (
        <HakoniwaMap islandName={island.island_name} data={island.island_info} />
      )}
    </>
  );
}
