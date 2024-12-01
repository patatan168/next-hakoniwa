import type { Meta, StoryObj } from '@storybook/react';

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
          '[MUI TextField](https://mui.com/material-ui/api/text-field/) / [React Hooks Form](https://react-hook-form.com/docs/useform) を統合したテキストボックス',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    name: '',
    control: undefined,
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
  },
} satisfies Meta<typeof TextFieldRHF>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultValues: userInfo = {
  id: '',
  password: '',
  islandName: '',
  passwordConfirm: '',
};

export const Example: Story = {
  render: () => {
    const { control } = useForm<userInfo>({
      defaultValues,
      resolver: zodResolver(userInfoSchema),
    });

    return (
      <meta.component
        required
        name="islandName"
        control={control}
        helperText={' '}
        id="island-name"
        label="Island Name"
        variant="outlined"
      />
    );
  },
};
