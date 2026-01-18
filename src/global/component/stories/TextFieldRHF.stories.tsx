import type { Meta, StoryObj } from '@storybook/nextjs';

import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { userInfo, userInfoSchema } from '@/global/valid/userInfo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const meta = {
  title: 'Global/TextFieldRHF',
  component: TextFieldRHF,
  parameters: {
    layout: 'centered',
    controls: { sort: 'requiredFirst' },
    docs: {
      description: {
        component:
          '[MUI TextField](https://mui.com/material-ui/api/text-field/) とテキストボックスのラッパー',
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
} satisfies Meta<typeof TextFieldRHF>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultValues: userInfo = {
  id: '',
  password: '',
  userName: '',
  islandName: '',
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
        required
        name="islandName"
        control={control}
        id="island-name"
        placeholder="Island Name"
        disabled={args.disabled}
        type={args.type}
        helperText={args.helperText}
        isBottomSpace={args.isBottomSpace}
      />
    );
  },
};
