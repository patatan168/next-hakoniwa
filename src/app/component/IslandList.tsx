'use client';
import TabContents, { TabType } from '@/global/component/TabContents';
import VrTableList, { ColumnInfo } from '@/global/component/VrTableList';
import { useFetch } from '@/global/function/fetch';
import { useCallback, useState } from 'react';

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
  const { data, isLoading } = useFetch('/api/auth/user', { method: 'GET' });
  const [listHeight, setListHeight] = useState('100svh');
  const listCallback = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      const { y } = node.getBoundingClientRect();
      setListHeight(`calc(100svh - ${y}px)`);
    }
  }, []);

  const handleChange = (newValue: number) => {
    setTab(newValue);
  };

  return (
    <>
      <TabContents value={tab} onChange={handleChange} tabContents={tabTest} />
      <VrTableList
        isLoading={isLoading}
        ref={listCallback}
        style={{ height: listHeight, backgroundColor: 'transparent' }}
        columnHeader={header}
        data={data}
      />
    </>
  );
}
