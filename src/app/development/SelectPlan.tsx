'use client';
import Button from '@/global/component/Button';
import { Card } from '@/global/component/Card';
import { RangeSliderRHF } from '@/global/component/RangeSliderRHF';
import { SelectRHF } from '@/global/component/SelectRHF';
import META_DATA from '@/global/define/metadata';
import { getPlanSelect } from '@/global/define/planType';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { developmentStore } from '@/global/store/api/auth/development';
import { planStore } from '@/global/store/api/auth/plan';
import { islandListStore } from '@/global/store/api/public/islandList';
import { planInfoZod, planInfoZodValid } from '@/global/valid/planInfo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

const POST_HEADER = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const defaultValues = {
  plan_no: 0,
  plan: 'leveling',
  to_uuid: '',
  x: 0,
  y: 0,
  times: 1,
};

/**
 * GetIslandList
 * Transforms the island data into a format suitable for a select input.
 * @param data - Array of island objects containing uuid and island_name.
 * @returns  Array of objects with label and value properties for each island.
 */
const GetIslandList = (
  data: { uuid: string; island_name: string }[] | undefined
): { label: string; value: string }[] =>
  useMemo(() => {
    if (!data) return [{ label: 'Loading...', value: '' }];
    return data.map((island) => ({
      label: `${island.island_name} 島`,
      value: island.uuid,
    }));
  }, [data]);

export default function SelectPlan() {
  // GET
  const { data: islandData, fetch: fetchDev } = useClientFetch(developmentStore);
  const { data: islandListData, fetch: fetchIslandList } = useClientFetch(islandListStore);
  useEffect(() => {
    fetchDev({ method: 'GET' });
    fetchIslandList({ method: 'GET' });
  }, []);
  // POST
  const [body, setBody] = useState('null');
  const { fetch: trigger } = useClientFetch(planStore);
  const islandList = GetIslandList(islandListData.get);
  const {
    watch,
    control,
    trigger: formTrig,
    setValue,
  } = useForm<Omit<planInfoZod, 'from_uuid'>>({
    defaultValues: defaultValues,
    resolver: zodResolver(
      planInfoZodValid.omit({
        from_uuid: true,
      })
    ),
  });

  useEffect(() => {
    formTrig();
    setBody(JSON.stringify(watch()));
  }, [watch()]);

  useEffect(() => {
    setValue('to_uuid', islandData.get?.uuid ?? '');
  }, [islandData]);

  return (
    <>
      <Card>
        <ul className="p-3">
          <li>
            <label htmlFor="plan">計画</label>
            <SelectRHF name="plan" control={control} id="plan" options={getPlanSelect()} />
          </li>
          <li>
            <label htmlFor="x">X座標</label>
            <RangeSliderRHF id="x" name="x" max={META_DATA.MAP_SIZE - 1} control={control} />
          </li>
          <li>
            <label htmlFor="y">Y座標</label>
            <RangeSliderRHF id="y" name="y" max={META_DATA.MAP_SIZE - 1} control={control} />
          </li>
          <li>
            <label htmlFor="to_uuid">目標島</label>
            <SelectRHF
              key={defaultValues.to_uuid}
              name="to_uuid"
              control={control}
              id="toUuid"
              options={islandList}
            />
          </li>
          <li>
            <label htmlFor="times">計画数</label>
            <RangeSliderRHF id="times" name="times" min={1} max={99} control={control} />
          </li>
          <li>
            <Button type="submit" onClick={() => trigger({ ...POST_HEADER, body: body })}>
              計画送信
            </Button>
          </li>
        </ul>
      </Card>
    </>
  );
}
