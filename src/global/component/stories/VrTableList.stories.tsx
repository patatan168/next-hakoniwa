import type { Meta, StoryObj } from '@storybook/nextjs';

import VrTableList, { ColumnInfo } from '@/global/component/VrTableList';

const header: ColumnInfo = [
  { width: 100, headName: 'UUID', key: 'uuid' },
  { width: 100, headName: 'Id', key: 'id' },
  { width: 100, headName: 'Password', key: 'password' },
  { width: 100, headName: '島名', key: 'island_name' },
  { width: 100, headName: '登録日', key: 'created_at' },
];

const dummyData = [
  {
    uuid: 'uuid',
    id: 'id',
    password: 'password',
    island_name: 'island_name',
    created_at: '2024/12/1 00:00:00',
  },
  {
    uuid: 'uuid',
    id: 'id',
    password: 'password',
    island_name: 'island_name',
    created_at: '2024/12/1 00:00:00',
  },
  {
    uuid: 'uuid',
    id: 'id',
    password: 'password',
    island_name: 'island_name',
    created_at: '2024/12/1 00:00:00',
  },
  {
    uuid: 'uuid',
    id: 'id',
    password: 'password',
    island_name: 'island_name',
    created_at: '2024/12/1 00:00:00',
  },
  {
    uuid: 'uuid',
    id: 'id',
    password: 'password',
    island_name: 'island_name',
    created_at: '2024/12/1 00:00:00',
  },
  {
    uuid: 'uuid',
    id: 'id',
    password: 'password',
    island_name: 'island_name',
    created_at: '2024/12/1 00:00:00',
  },
  {
    uuid: 'uuid',
    id: 'id',
    password: 'password',
    island_name: 'island_name',
    created_at: '2024/12/1 00:00:00',
  },
  {
    uuid: 'uuid',
    id: 'id',
    password: 'password',
    island_name: 'island_name',
    created_at: '2024/12/1 00:00:00',
  },
];

const meta = {
  title: 'Global/VrTableList',
  component: VrTableList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '仮想スクロール機能付きのテーブル',
      },
      controls: { sort: 'requiredFirst' },
    },
  },
  tags: ['autodocs'],
  args: {
    isLoading: false,
    columnHeader: header,
    data: dummyData,
    style: { height: '300px', width: '900px' },
  },
  argTypes: {
    isLoading: {
      description: 'ロード中か',
      control: 'boolean',
      table: {
        type: { summary: 'undefined|boolean' },
      },
    },
    style: {
      description: 'CSS Style',
      control: 'object',
      table: {
        type: { summary: 'undefined|CSSProperties' },
      },
    },
    columnHeader: {
      description:
        '`width`:列の横幅<br>`headName`:ヘッダーの名称<br>`key`:Objectキー<br>`headStyle`:ヘッダーのスタイル<br>`dataStyle`:データーのスタイル',
      type: { name: 'other', value: '', required: true },
      control: 'object',
      table: {
        type: { summary: 'ColumnInfo' },
      },
    },
    data: {
      description: 'データー',
      control: 'object',
      table: {
        type: { summary: 'undefined|Array<object>' },
      },
    },
  },
} satisfies Meta<typeof VrTableList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => {
    return <meta.component {...args} />;
  },
};
