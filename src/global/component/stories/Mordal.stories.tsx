import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import Button from '../Button';
import { Modal } from '../Modal';

const meta = {
  title: 'Global/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    controls: { sort: 'requiredFirst' },
    docs: {
      description: {
        component: '左右中央配置の一般的なモーダル。',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    header: 'test',
    body: undefined,
    footer: undefined,
    open: false,
    openToggle: undefined,
  },
  argTypes: {
    header: {
      description: 'ヘッダーの内容',
      table: {
        type: { summary: 'string | ReactNode' },
      },
    },
    body: {
      description: 'モーダルの本体内容',
      type: { name: 'other', value: '', required: true },
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    footer: {
      description: 'モーダルのフッター内容',
      type: { name: 'other', value: '', required: false },
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    open: {
      description: 'モーダルの開閉状態',
      control: 'boolean',
      type: { name: 'boolean', required: true },
      table: {
        type: { summary: 'boolean' },
      },
    },
    openToggle: {
      description: 'モーダルの開閉を制御する関数<br/>引数無しの関数も受付可能',
      type: { name: 'function', required: true },
      table: {
        type: { summary: '(value: boolean) => void | () => void' },
      },
    },
    hidden: {
      description:
        '`true`: Close時に`display: none` <br/> `false`: Close時に要素ごと開放 <br/>`true`の場合、Close時してもモーダルの状態を保持できるが、パフォーマンスは悪化する',
      control: 'boolean',
      type: { name: 'boolean', required: false },
      table: {
        type: { summary: 'boolean' },
      },
    },
    preRender: {
      description:
        '`true`: 初回Openまでレンダリングしない<br/>`false`: 初回Open前からレンダリングする<br/>`true`の場合、初回Open前からモーダルを準備できるが、パフォーマンスは悪化する',
      control: 'boolean',
      type: { name: 'boolean', required: false },
      table: {
        type: { summary: 'boolean' },
      },
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const openToggle = () => {
      setOpen(!open);
    };
    return (
      <>
        <Button
          type="button"
          onClick={() => openToggle()}
          aria-haspopup="dialog"
          aria-expanded="false"
        >
          Open modal
        </Button>
        <meta.component
          {...args}
          open={open}
          openToggle={openToggle}
          body={<TestBody />}
          footer={<TestFooter />}
        />
      </>
    );
  },
};

const TestBody = () => {
  return (
    <div className="p-4">
      <p>This is a test body content for the modal.</p>
    </div>
  );
};

const TestFooter = () => {
  return (
    <Button type="button" onClick={() => alert('Footer button clicked!')}>
      Footer Button
    </Button>
  );
};
