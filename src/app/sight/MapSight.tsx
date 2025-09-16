'use client';
import HakoniwaMap from '@/global/component/HakoniwaMap';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useWindowSize } from '@/global/function/useWindowSize';
import { islandSightStore } from '@/global/store/api/public/islandSight';
import { useEffect, useMemo } from 'react';

export default function MapSight({ uuid }: { uuid: string | string[] | undefined }) {
  const {
    data: islandData,
    fetchIfNeeded: fetchIsland,
    isLoading,
  } = useClientFetch(islandSightStore);

  const [width, height] = useWindowSize();
  const mapSize = useMemo(() => `min(${width}px, ${height}px)`, [width, height]);

  useEffect(() => {
    fetchIsland({ method: 'GET' }, { query: `uuid=${uuid}` });
  });

  return (
    <>
      <HakoniwaMap
        style={{ width: mapSize, height: mapSize }}
        isLoading={isLoading.get}
        islandName={islandData.get?.island_name}
        data={islandData.get?.island_info}
      />
    </>
  );
}
