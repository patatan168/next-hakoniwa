import type { Meta, StoryObj } from '@storybook/react';

import { RangeSliderRHF } from '@/global/component/RangeSliderRHF';
import { useForm } from 'react-hook-form';

const meta = {
  title: 'Global/RangeSliderRHF',
  component: RangeSliderRHF,
  parameters: {
    layout: 'centered',
    controls: { sort: 'requiredFirst' },
    docs: {
      description: {
        component:
          '`RangeSliderRHF` は、React Hook Form を使用して、範囲スライダーを実装するコンポーネントです。',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    name: '',
    control: undefined,
    disabled: false,
  },
  argTypes: {
    name: {
      description: 'テキストボックスの識別子',
      table: {
        type: { summary: 'string' },
      },
    },
    control: {
      description: '[React Hooks Form Control](https://react-hook-form.com/docs/useform/control)',
      table: {
        type: { summary: ' Control<TFieldValues> | undefined' },
      },
    },
    disabled: {
      description: 'テキストボックスを無効化するか',
      control: 'boolean',
      table: {
        type: { summary: 'undefined|boolean' },
      },
    },
  },
} satisfies Meta<typeof RangeSliderRHF>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultValues = {
  times: 0,
};

export const Example: Story = {
  render: (args) => {
    const { control } = useForm({
      defaultValues,
    });

    return (
      <meta.component
        required
        name="times"
        defaultValue={0}
        control={control}
        id="times"
        placeholder="数量"
        disabled={args.disabled}
        helperText={args.helperText}
        isBottomSpace={args.isBottomSpace}
      />
    );
  },
};
