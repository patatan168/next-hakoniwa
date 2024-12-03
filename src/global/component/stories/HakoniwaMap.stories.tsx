import type { Meta, StoryObj } from '@storybook/react';
import HakoniwaMap from '../HakoniwaMap';

const dummyData = [
  {
    x: 0,
    y: 0,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 1,
    y: 0,
    type: 'factory',
    landValue: 10,
  },
  {
    x: 2,
    y: 0,
    type: 'farm',
    landValue: 50,
  },
  {
    x: 3,
    y: 0,
    type: 'mining',
    landValue: 200,
  },
  {
    x: 4,
    y: 0,
    type: 'forest',
    landValue: 10,
  },
  {
    x: 5,
    y: 0,
    type: 'mountain',
    landValue: 0,
  },
  {
    x: 6,
    y: 0,
    type: 'plains',
    landValue: 0,
  },
  {
    x: 7,
    y: 0,
    type: 'shallows',
    landValue: 0,
  },
  {
    x: 8,
    y: 0,
    type: 'wasteland',
    landValue: 0,
  },
  {
    x: 9,
    y: 0,
    type: 'missile',
    landValue: 200,
  },
  {
    x: 10,
    y: 0,
    type: 'submarine_missile',
    landValue: 200,
  },
  {
    x: 11,
    y: 0,
    type: 'defence_base',
    landValue: 0,
  },
  {
    x: 0,
    y: 1,
    type: 'people',
    landValue: 1,
  },
  {
    x: 1,
    y: 1,
    type: 'people',
    landValue: 30,
  },
  {
    x: 2,
    y: 1,
    type: 'people',
    landValue: 100,
  },
  {
    x: 3,
    y: 1,
    type: 'monument',
    landValue: 0,
  },
  {
    x: 4,
    y: 1,
    type: 'inora',
    landValue: 1,
  },
  {
    x: 5,
    y: 1,
    type: 'meka_inora',
    landValue: 0,
  },
  {
    x: 6,
    y: 1,
    type: 'inora_ghost',
    landValue: 0,
  },
  {
    x: 7,
    y: 1,
    type: 'red_inora',
    landValue: 0,
  },
  {
    x: 8,
    y: 1,
    type: 'dark_inora',
    landValue: 0,
  },
  {
    x: 9,
    y: 1,
    type: 'king_inora',
    landValue: 0,
  },
  {
    x: 10,
    y: 1,
    type: 'sanjira',
    landValue: 0,
  },
  {
    x: 11,
    y: 1,
    type: 'kujira',
    landValue: 0,
  },
  {
    x: 0,
    y: 2,
    type: 'fake_forest',
    landValue: 0,
  },
  {
    x: 1,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 2,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 3,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 4,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 5,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 6,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 7,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 8,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 9,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 10,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
  {
    x: 11,
    y: 2,
    type: 'sea',
    landValue: 0,
  },
];

const meta = {
  title: 'Global/HakoniwaMap',
  component: HakoniwaMap,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'マップ',
      },
      controls: { sort: 'requiredFirst' },
    },
  },
  tags: ['autodocs'],
  args: {
    islandName: 'hoge',
    data: dummyData,
  },
  argTypes: {
    islandName: {
      description: '島の名前',
      control: 'text',
      table: {
        type: { summary: 'string' },
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
} satisfies Meta<typeof HakoniwaMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => {
    return <meta.component {...args} />;
  },
};
