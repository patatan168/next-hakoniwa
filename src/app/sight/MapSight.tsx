'use client';
import IslandData from '@/global/component/IslandData';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useWindowSize } from '@/global/function/useWindowSize';
import { islandSightStore } from '@/global/store/api/public/islandSight';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), { ssr: false });

export default function MapSight({
  uuid,
  create,
}: {
  uuid: string | string[] | undefined;
  create?: boolean;
}) {
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
    <div className="grid grid-rows-[auto_auto_auto_1fr] justify-items-center gap-1 px-1">
      <span className="text-bold text-3xl text-red-900">
        {`「${islandData.get?.island_name || ''}島」`}
        {create && <span className="text-black">{`が発見されました！！`}</span>}
        {!create && <span className="text-black">{`へようこそ！！`}</span>}
      </span>
      {create && (
        <Link href="/development" className="text-2xl text-blue-500 underline">
          島を開発する
        </Link>
      )}
      {!create && (
        <Link href="/" className="text-2xl text-blue-500 underline">
          トップへ戻る
        </Link>
      )}
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
