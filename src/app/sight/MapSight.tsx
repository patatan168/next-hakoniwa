/**
 * @module MapSight
 * @description 島の地図表示・詳細情報コンポーネント。
 */
'use client';
import { Island, TurnLog, User } from '@/db/kysely';
import IslandData from '@/global/component/IslandData';
import TabContents, { TabType } from '@/global/component/TabContents';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useClientRect } from '@/global/function/useClientRect';
import { turnStore } from '@/global/store/api/public/turn';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { RiRoadMapFill } from 'react-icons/ri';
const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), { ssr: false });
const TurnLogList = dynamic(() => import('@/global/component/TurnLog'), { ssr: false });

const tabs: Array<TabType> = [
  { value: 0, label: 'マップ', icons: <RiRoadMapFill /> },
  { value: 1, label: '近況を見る', icons: <IoDocumentTextOutline /> },
];

export default function MapSight({
  islandData,
  uuid,
  create,
}: {
  islandData: Island & Omit<User, 'island_name_changed_at'> & { rank: number };
  uuid: string;
  create?: boolean;
}) {
  const { data: turnData, fetch: fetchTurn, isLoading } = useClientFetch(turnStore);
  const prevLastUuid = useRef('');
  const [tab, setTab] = useState(0);
  const [logData, setLogData] = useState<Omit<TurnLog, 'secret_log'>[]>([]);
  const [lazyFlag, setLazyFlag] = useState(false);
  const [rect, callback] = useClientRect<HTMLDivElement>();
  const displayIslandName = `${islandData.island_name_prefix ?? ''}${islandData.island_name ?? ''}`;
  const fetchLog = async (lastUuid?: string) => {
    const res = lastUuid
      ? await fetch(`/api/public/turn-log?log_uuid=${lastUuid}&user_uuid=${uuid}`)
      : await fetch(`/api/public/turn-log?user_uuid=${uuid}`);
    if (!res.ok) return;
    const json = (await res.json()) as Omit<TurnLog, 'secret_log'>[];
    setLogData([...logData, ...json]);
  };

  const handleChange = (newValue: number) => {
    setTab(newValue);
  };

  const mapSize = rect
    ? `min(calc(var(--real-vw) - ${rect.x}px - 0.25rem), calc(var(--real-vh-minus-footer) - ${rect.y}px))`
    : 'min(var(--real-vw), var(--real-vh-minus-footer))';
  const logHeight = rect
    ? `calc(var(--real-vh-minus-footer) - ${rect.y}px)`
    : 'var(--real-vh-minus-footer)';
  const logWidth = rect ? `calc(var(--real-vw) - ${rect.x}px - 0.25rem)` : 'var(--real-vw)';

  useEffect(() => {
    fetchTurn({ method: 'GET', cache: 'no-store' }, { refresh: true });
    fetchLog();
  }, []);

  useEffect(() => {
    if (lazyFlag && logData) {
      const lastUuid = logData.at(-1)?.log_uuid ?? '';
      if (lastUuid === prevLastUuid.current) return;
      prevLastUuid.current = lastUuid;
      fetchLog(lastUuid);
    }
  }, [lazyFlag]);

  return (
    <div className="grid grid-rows-[auto_auto_auto_1fr] justify-items-center gap-0 px-1">
      <span className="text-bold my-1 text-3xl text-red-900">
        {`「${displayIslandName}島」`}
        {create && <span className="text-black">{`が発見されました！！`}</span>}
        {!create && <span className="text-black">{`へようこそ！！`}</span>}
      </span>
      {create && (
        <Link href="/development" className="my-1 text-2xl text-blue-500 underline">
          島を開発する
        </Link>
      )}
      {!create && (
        <Link href="/" className="my-1 text-2xl text-blue-500 underline">
          トップへ戻る
        </Link>
      )}
      <IslandData mode="sight" data={islandData} />
      {!create && (
        <>
          <TabContents value={tab} onChange={handleChange} tabContents={tabs} />
          <hr className="w-full border-t border-gray-200" />
        </>
      )}
      <div ref={callback} className="mt-2">
        {tab === 0 && (
          <HakoniwaMap
            style={{ width: mapSize, height: 'auto', maxHeight: mapSize }}
            className="max-w-full"
            isLoading={isLoading.get}
            islandName={displayIslandName}
            turn={turnData.get?.turn}
            data={islandData.island_info}
          />
        )}
        {tab === 1 && (
          <TurnLogList
            style={{ width: logWidth, height: logHeight, backgroundColor: 'transparent' }}
            logs={logData}
            setLazyFlag={setLazyFlag}
          />
        )}
      </div>
    </div>
  );
}
