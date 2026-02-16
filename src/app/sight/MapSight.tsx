'use client';
import IslandData from '@/global/component/IslandData';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useWindowSize } from '@/global/function/useWindowSize';
import { islandSightStore } from '@/global/store/api/public/islandSight';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), { ssr: false });

export default function MapSight({ uuid }: { uuid: string | string[] | undefined }) {
  const { data: islandData, fetch: fetchIsland, isLoading } = useClientFetch(islandSightStore);

  const [mapSize, setMapSize] = useState('min(var(--real-vw), var(--real-vh-minus-footer))');
  const { width, minusFooterHeight } = useWindowSize();
  const mapCallback = useCallback(
    (node: HTMLDivElement) => {
      if (node !== null) {
        const { x, y } = node.getBoundingClientRect();
        setMapSize(`min(${width - x}px, ${minusFooterHeight - y}px)`);
      }
    },
    [width, minusFooterHeight]
  );

  useEffect(() => {
    fetchIsland({ method: 'GET' }, { query: `uuid=${uuid}` });
  }, []);

  return (
    <div className="grid justify-items-center">
      <span className="text-bold text-3xl text-red-900">
        {`「${islandData.get ? islandData.get.island_name : 'Loading'}島」`}{' '}
        <span className="text-black">{`へようこそ！！`}</span>
      </span>
      <Link href="/" className="text-2xl text-blue-500 underline">
        トップへ戻る
      </Link>
      <IslandData mode="sight" data={islandData.get} />
      <HakoniwaMap
        ref={mapCallback}
        style={{ width: mapSize, height: 'auto', maxHeight: mapSize }}
        isLoading={isLoading.get}
        islandName={islandData.get?.island_name}
        data={islandData.get?.island_info}
      />
    </div>
  );
}
