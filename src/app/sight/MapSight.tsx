'use client';
import IslandData from '@/global/component/IslandData';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useClientRect } from '@/global/function/useClientRect';
import { islandSightStore } from '@/global/store/api/public/islandSight';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect } from 'react';
const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), { ssr: false });

export default function MapSight({
  uuid,
  create,
}: {
  uuid: string | string[] | undefined;
  create?: boolean;
}) {
  const { data: islandData, fetch: fetchIsland, isLoading } = useClientFetch(islandSightStore);
  const [mapRect, mapCallback] = useClientRect<HTMLDivElement>();
  const displayIslandName = `${islandData.get?.island_name_prefix ?? ''}${islandData.get?.island_name ?? ''}`;

  const mapSize = mapRect
    ? `min(calc(var(--real-vw) - ${mapRect.x}px), calc(var(--real-vh-minus-footer) - ${mapRect.y}px))`
    : 'min(var(--real-vw), var(--real-vh-minus-footer))';

  useEffect(() => {
    fetchIsland({ method: 'GET' }, { query: `uuid=${uuid}` });
  }, []);

  return (
    <div className="grid grid-rows-[auto_auto_auto_1fr] justify-items-center gap-1 px-1">
      <span className="text-bold text-3xl text-red-900">
        {`「${displayIslandName}島」`}
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
        islandName={displayIslandName}
        data={islandData.get?.island_info}
      />
    </div>
  );
}
