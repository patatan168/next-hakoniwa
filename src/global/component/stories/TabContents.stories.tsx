import type { Meta, StoryObj } from '@storybook/nextjs';

import TabContents, { TabType } from '@/global/component/TabContents';
import { omit } from '@/global/function/collection';
import { useState } from 'react';
import { fn } from 'storybook/test';

const tabTest: Array<TabType> = [
  { value: 0, label: 'test0' },
  { value: 1, label: 'test1' },
  { value: 2, label: 'disabled', disabled: true },
];

const meta = {
  title: 'Global/TabContents',
  component: TabContents,
  parameters: {
    layout: 'centered',
    controls: { sort: 'requiredFirst' },
    docs: {
      description: {
        component: 'タブのラッパー。`tabContents`で配列を記載することで勝手にタブを並べてくれる。',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    value: 0,
    style: undefined,
    tabContents: tabTest,
    onChange: fn(),
  },
  argTypes: {
    value: {
      description: 'タブの値',
      type: { name: 'other', value: '', required: true },
      table: {
        type: { summary: 'unknown' },
      },
    },
    style: {
      description: 'CSS Style',
      control: 'object',
      table: {
        type: { summary: 'undefined|CSSProperties' },
      },
    },
    tabContents: {
      description: 'タブの値、ラベル、Disabledの配列',
      type: { name: 'other', value: '', required: true },
      control: 'object',
      table: {
        type: { summary: 'Array<TabOwnProps>' },
      },
    },
    onChange: {
      description: 'valueを切り替えるCallback',
      type: { name: 'other', value: '', required: true },
    },
  },
} satisfies Meta<typeof TabContents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => {
    const [tab, setTab] = useState(0);
    const handleChange = (newValue: number) => {
      setTab(newValue);
    };
    const props = omit(args, ['value', 'onChange']);

    return <meta.component value={tab} onChange={handleChange} {...props} />;
  },
};

export const VerticalLeft: Story = {
  render: (args) => {
    const [tab, setTab] = useState(0);
    const handleChange = (newValue: number) => {
      setTab(newValue);
    };
    const props = omit(args, ['value', 'onChange']);

    return (
      <div className="flex">
        <meta.component
          value={tab}
          onChange={handleChange}
          {...props}
          orientation="vertical-left"
          tabContents={[
            { value: 0, label: 'Settings' },
            { value: 1, label: 'Profile' },
            { value: 2, label: '設定 (JP)' },
          ]}
        />
        <div className="h-96 w-64 border border-l-0 border-gray-200 p-4">
          Content on the Right (Tabs on Left)
        </div>
      </div>
    );
  },
};

export const VerticalRight: Story = {
  render: (args) => {
    const [tab, setTab] = useState(0);
    const handleChange = (newValue: number) => {
      setTab(newValue);
    };
    const props = omit(args, ['value', 'onChange']);

    return (
      <div className="flex">
        <div className="h-96 w-64 border border-r-0 border-gray-200 p-4">
          Content on the Left (Tabs on Right)
        </div>
        <meta.component
          value={tab}
          onChange={handleChange}
          {...props}
          orientation="vertical-right"
          tabContents={[
            { value: 0, label: 'Settings' },
            { value: 1, label: 'Profile' },
            { value: 2, label: '設定 (JP)' },
          ]}
        />
      </div>
    );
  },
};
