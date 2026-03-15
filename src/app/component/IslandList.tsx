'use client';
import IslandListData from '@/global/component/IslandList';
import TabContents, { TabType } from '@/global/component/TabContents';
import TurnLog from '@/global/component/TurnLog';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { useClientRect } from '@/global/function/useClientRect';
import { islandListStore } from '@/global/store/api/public/islandList';
import { turnLogStore } from '@/global/store/api/public/turnLog';
import { useEffect, useRef, useState } from 'react';
import { FaList } from 'react-icons/fa6';
import { IoDocumentTextOutline } from 'react-icons/io5';

const tabTest: Array<TabType> = [
  { value: 0, label: '諸島の状況', icons: <FaList /> },
  { value: 1, label: '近況を見る', icons: <IoDocumentTextOutline /> },
];

export default function IslandList() {
  const [tab, setTab] = useState(0);
  const { data, isLoading, fetch } = useClientFetch(islandListStore);
  const { data: logData, fetch: logFetch } = useClientFetch(turnLogStore);
  const [listRect, listCallback] = useClientRect<HTMLDivElement>();
  const listHeight = listRect
    ? `calc(var(--real-vh-minus-footer) - ${listRect.y}px)`
    : 'var(--real-vh-minus-footer)';
  const [lazyFlag, setLazyFlag] = useState(false);
  const prevLastUuid = useRef('');

  const handleChange = (newValue: number) => {
    setTab(newValue);
  };

  useEffect(() => {
    fetch({ method: 'GET' });
    logFetch({ method: 'GET' });
  }, []);

  useEffect(() => {
    if (lazyFlag && logData.get) {
      const lastUuid = logData.get.at(-1)?.log_uuid ?? '';
      if (lastUuid === prevLastUuid.current) return;
      prevLastUuid.current = lastUuid;
      logFetch({ method: 'GET' }, { query: `log_uuid=${lastUuid}` });
    }
  }, [lazyFlag]);

  return (
    <>
      <TabContents value={tab} onChange={handleChange} tabContents={tabTest} />
      <div className="mt-2" ref={listCallback}>
        {tab === 0 && (
          <IslandListData
            style={{ height: listHeight, backgroundColor: 'transparent' }}
            islands={!isLoading.get ? data.get : undefined}
          />
        )}
        {tab === 1 && (
          <TurnLog
            style={{ height: listHeight, backgroundColor: 'transparent' }}
            logs={logData.get}
            setLazyFlag={setLazyFlag}
          />
        )}
      </div>
    </>
  );
}
