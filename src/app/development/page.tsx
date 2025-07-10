'use client';
import { Card } from '@/global/component/Card';
import { useFetch } from '@/global/function/fetch';
import dynamic from 'next/dynamic';

const HakoniwaMap = dynamic(() => import('@/global/component/HakoniwaMap'), {
  ssr: true,
});

const SelectPlan = dynamic(() => import('@/app/development/SelectPlan'));

export default function IslandList() {
  const { data, isLoading } = useFetch('/api/auth/development', { method: 'GET' });

  return (
    <>
      <div className="flex">
        <SelectPlan />
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column', // 子要素を縦並びに
            justifyContent: 'center', // 縦方向に中央寄せ
            alignItems: 'center', // 横方向にも中央寄せ（必要に応じて）
            width: 'fit-content',
          }}
        >
          <HakoniwaMap
            isLoading={isLoading}
            islandName={data?.island_name}
            data={data?.island_info}
          />
        </Card>
      </div>
    </>
  );
}
