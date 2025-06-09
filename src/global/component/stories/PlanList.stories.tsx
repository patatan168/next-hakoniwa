import type { Meta, StoryObj } from '@storybook/react';

import { planSchemaType } from '@/db/schema/planTable';
import { PlanList } from '@/global/component/PlanList';

const planTest: Array<planSchemaType> = [
  { from_uuid: 'test', to_uuid: 'test', plan_no: 0, times: 0, x: 0, y: 0, plan: 'afforest' },
  { from_uuid: 'test', to_uuid: 'test', plan_no: 1, times: 0, x: 0, y: 0, plan: 'test1' },
  { from_uuid: 'test', to_uuid: 'test', plan_no: 2, times: 0, x: 0, y: 0, plan: 'test2' },
  { from_uuid: 'test', to_uuid: 'test', plan_no: 3, times: 0, x: 10, y: 0, plan: 'test3' },
  { from_uuid: 'test', to_uuid: 'test', plan_no: 4, times: 0, x: 0, y: 0, plan: 'test4' },
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
    turn: 0,
  },
  argTypes: {
    planData: {
      description: '計画リスト',
      type: { name: 'other', value: '', required: true },
      table: {
        type: { summary: 'Array<planSchemaType>' },
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
    return <meta.component {...args} />;
  },
};
