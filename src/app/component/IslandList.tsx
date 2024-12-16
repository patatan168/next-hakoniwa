'use client';
import TabContents, { TabType } from '@/global/component/TabContents';
import VrTableList, { ColumnInfo } from '@/global/component/VrTableList';
import { useFetch } from '@/global/function/fetch';
import { useBoundingClient } from '@/global/function/useBoundingClient';
import { useRef, useState } from 'react';

const header: ColumnInfo = [
  { width: 100, headName: 'UUID', key: 'uuid' },
  { width: 200, headName: 'Id', key: 'id' },
  { width: 200, headName: 'Password', key: 'password' },
  { width: 100, headName: '島名', key: 'island_name' },
  { width: 100, headName: '登録日', key: 'created_at' },
];

const tabTest: Array<TabType> = [
  { value: 0, label: '諸島の状況' },
  { value: 1, label: '近況を見る' },
];

export default function IslandList() {
  const [tab, setTab] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useFetch('/api/auth/user', { method: 'GET' });
  const { y } = useBoundingClient(listRef.current);

  const handleChange = (newValue: number) => {
    setTab(newValue);
  };

  return (
    <>
      <TabContents value={tab} onChange={handleChange} tabContents={tabTest} />
      <VrTableList
        isLoading={isLoading}
        ref={listRef}
        style={{ height: `calc(100svh - ${y}px)` }}
        columnHeader={header}
        data={data}
      />
    </>
  );
}
