import type { Meta, StoryObj } from '@storybook/nextjs';

import { planSchemaType } from '@/db/schema/planTable';
import { PlanList } from '@/global/component/PlanList';
import { omit } from 'es-toolkit';
import { useState } from 'react';
import { fn } from 'storybook/test';

const planTest: Array<planSchemaType> = [
  { from_uuid: 'test', to_uuid: 'test', plan_no: 0, times: 0, x: 0, y: 0, plan: 'afforest' },
  { from_uuid: 'test', to_uuid: 'test', plan_no: 1, times: 0, x: 0, y: 0, plan: 'test1' },
  { from_uuid: 'test', to_uuid: 'test', plan_no: 2, times: 0, x: 0, y: 0, plan: 'test2' },
  { from_uuid: 'test', to_uuid: 'test', plan_no: 3, times: 0, x: 10, y: 0, plan: 'test3' },
  { from_uuid: 'test', to_uuid: 'test', plan_no: 4, times: 0, x: 0, y: 0, plan: 'test4' },
];

const islandList = [
  { uuid: 'test', island_name: 'test島' },
  { uuid: 'test2', island_name: 'test2島' },
];

const meta = {
  title: 'Global/PlanList',
  component: PlanList,
  parameters: {
    layout: 'centered',
    controls: { sort: 'requiredFirst' },
    docs: {
      description: {
        component: '`PlanList` は、計画リストを表示するコンポーネントです。',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    planData: planTest,
    setPlanData: fn(),
    turn: 0,
    uuid: 'test',
    islandList: islandList,
    isPlanLoading: false,
  },
  argTypes: {
    planData: {
      description: '計画リスト',
      type: { name: 'other', value: '', required: true },
      table: {
        type: { summary: 'Array<planSchemaType>' },
      },
    },
    setPlanData: {
      description: '計画リストを更新する関数',
      type: { name: 'other', value: '', required: true },
    },
    uuid: {
      description: '島のUUID',
      type: { name: 'string', required: true },
    },
    islandList: {
      description: '島のリスト',
      type: { name: 'other', value: '', required: true },
      table: {
        type: { summary: 'Array<{uuid:string,island_name:string}>' },
      },
    },
    isPlanLoading: {
      description: '計画がロード中かどうか',
      control: 'boolean',
      table: {
        type: { summary: 'undefined|boolean' },
      },
    },
    turn: {
      description: '現在のターン数',
    },
  },
} satisfies Meta<typeof PlanList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => {
    const [planData, setPlanData] = useState(args.planData || planTest);
    const props = omit(args, ['planData', 'setPlanData']);
    return <meta.component planData={planData} setPlanData={setPlanData} {...props} />;
  },
};
