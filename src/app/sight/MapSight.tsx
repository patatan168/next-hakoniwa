'use client';
import HakoniwaMap from '@/global/component/HakoniwaMap';
import IslandData from '@/global/component/IslandData';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useWindowSize } from '@/global/function/useWindowSize';
import { islandSightStore } from '@/global/store/api/public/islandSight';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

export default function MapSight({ uuid }: { uuid: string | string[] | undefined }) {
  const {
    data: islandData,
    fetchIfNeeded: fetchIsland,
    isLoading,
  } = useClientFetch(islandSightStore);

  const [mapSize, setMapSize] = useState('min(100vw, 100vh)');
  const [width, height] = useWindowSize();
  const mapCallback = useCallback(
    (node: HTMLDivElement) => {
      if (node !== null) {
        const { x, y } = node.getBoundingClientRect();
        setMapSize(`min(${width - x}px, ${height - y}px)`);
      }
    },
    [width, height]
  );

  useEffect(() => {
    fetchIsland({ method: 'GET' }, { query: `uuid=${uuid}` });
  }, []);

  return (
    <div className="grid justify-items-center">
      <span className="text-bold text-3xl text-red-700">
        {`「${islandData.get ? islandData.get.island_name : 'Loading'}島」`}{' '}
        <span className="text-black">{`へようこそ！！`}</span>
      </span>
      <Link href="/" className="text-2xl text-blue-500 underline">
        トップへ戻る
      </Link>
      <IslandData mode="sight" data={islandData.get} />
      <HakoniwaMap
        ref={mapCallback}
        style={{ width: mapSize, height: mapSize }}
        isLoading={isLoading.get}
        islandName={islandData.get?.island_name}
        data={islandData.get?.island_info}
      />
    </div>
  );
}
