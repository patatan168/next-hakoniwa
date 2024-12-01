import { TabOwnProps } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';

import TabContents from '@/global/component/TabContents';
import { fn } from '@storybook/test';
import { omit } from 'es-toolkit';
import { useState } from 'react';

const tabTest: Array<TabOwnProps> = [
  { value: 0, label: 'test0' },
  { value: 1, label: 'test1' },
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
    tabsProp: {
      description:
        '[MUI Tabs](https://mui.com/base-ui/react-tabs/components-api/#tabs)のプロパティ',
      control: 'object',
      table: {
        type: { summary: 'undefined|TabsProp' },
      },
    },
    tabContents: {
      description: '[MUI Tab](https://mui.com/base-ui/react-tabs/components-api/#tab)の配列',
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
    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
      setTab(newValue);
    };
    const props = omit(args, ['value', 'onChange']);

    return <meta.component value={tab} onChange={handleChange} {...props} />;
  },
};
