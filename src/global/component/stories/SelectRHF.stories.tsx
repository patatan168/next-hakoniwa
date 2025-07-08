import type { Meta, StoryObj } from '@storybook/nextjs';

import { SelectRHF } from '@/global/component/SelectRHF';
import { getPlanSelect } from '@/global/define/planType';
import { userInfo, userInfoSchema } from '@/global/valid/userInfo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const meta = {
  title: 'Global/SelectRHF',
  component: SelectRHF,
  parameters: {
    layout: 'centered',
    controls: { sort: 'requiredFirst' },
    docs: {
      description: {
        component: '<select>とReactHookFormのラッパー',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    name: '',
    control: undefined,
    disabled: false,
    options: [
      { value: 'test', label: 'test島', className: 'text-red-600' },
      { value: 'testttttttt', label: 'testttttttttt' },
    ],
  },
  argTypes: {
    name: {
      description: 'セレクトボックスの識別子',
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
} satisfies Meta<typeof SelectRHF>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultValues: userInfo = {
  id: '',
  password: '',
  islandName: 'test',
  passwordConfirm: '',
};

export const Example: Story = {
  render: (args) => {
    const { control } = useForm<userInfo>({
      defaultValues,
      resolver: zodResolver(userInfoSchema),
    });

    return (
      <meta.component
        name="islandName"
        control={control}
        id="island-name"
        disabled={args.disabled}
        helperText={args.helperText}
        isBottomSpace={args.isBottomSpace}
        options={getPlanSelect()}
      />
    );
  },
};
