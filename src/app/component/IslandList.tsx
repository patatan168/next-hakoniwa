'use client';
import TabContents from '@/global/component/TabContents';
import VrTableList, { ColumnInfo } from '@/global/component/VrTableList';
import { useFetch } from '@/global/function/fetch';
import { useBoundingClient } from '@/global/function/useBoundingClient';
import { TabOwnProps } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

const header: ColumnInfo = [
  { width: 100, headName: 'UUID', key: 'uuid' },
  { width: 100, headName: 'Id', key: 'id' },
  { width: 100, headName: 'Password', key: 'password' },
  { width: 100, headName: '島名', key: 'islandName' },
  { width: 100, headName: '登録日', key: 'createdAt' },
];

const tabTest: Array<TabOwnProps> = [
  { value: 0, label: 'test' },
  { value: 1, label: 'test1' },
];

export default function IslandList() {
  const [tab, setTab] = useState(0);
  const [user, setUser] = useState([{}]);
  const listRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useFetch('/api/public/user', { method: 'GET' });
  const { y } = useBoundingClient(listRef.current);
  const merginHeight = 10;

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  useEffect(() => {
    if (data !== undefined) {
      setUser(data);
    }
  }, [data]);

  return (
    <>
      <TabContents value={tab} onChange={handleChange} tabContents={tabTest} />
      <VrTableList
        isLoading={isLoading}
        ref={listRef}
        style={{ height: `calc(100svh - ${y + merginHeight}px)` }}
        columnHeader={header}
        data={user}
      />
    </>
  );
}
