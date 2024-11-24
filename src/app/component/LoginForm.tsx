'use client';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { useFetchTrig } from '@/global/function/fetch';
import { userInfo, userInfoSchema } from '@/global/valid/userInfo';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

const POST_HEADER = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const defaultValues: userInfo = {
  id: '',
  password: '',
  islandName: '',
  passwordConfirm: '',
};

export default function LoginForm() {
  const {
    watch,
    reset,
    control,
    trigger: formTrig,
  } = useForm<userInfo>({
    defaultValues,
    resolver: zodResolver(userInfoSchema),
  });
  const [body, setBody] = useState('null');
  const { trigger } = useFetchTrig('/api/auth/user', {
    ...POST_HEADER,
    body: body,
  });

  useEffect(() => {
    formTrig();
    setBody(JSON.stringify(watch()));
  }, [watch()]);

  return (
    <>
      <Stack sx={{ mb: 2 }} direction="row" justifyContent="space-between">
        <Button
          variant="contained"
          type="submit"
          onClick={() => {
            trigger();
            reset();
          }}
        >
          Post
        </Button>
      </Stack>
      <Stack spacing={2}>
        <TextFieldRHF
          required
          name="islandName"
          control={control}
          helperText={' '}
          id="island-name"
          label="Island Name"
          variant="outlined"
        />
        <TextFieldRHF
          required
          name="id"
          control={control}
          helperText={' '}
          id="user-id"
          label="User Id"
          variant="outlined"
        />
        <TextFieldRHF
          required
          name="password"
          control={control}
          helperText={' '}
          type="password"
          id="password"
          label="Password"
          variant="outlined"
        />
        <TextFieldRHF
          required
          name="passwordConfirm"
          control={control}
          helperText={' '}
          type="password"
          id="password-confirm"
          label="Password (Confirm)"
          variant="outlined"
        />
      </Stack>
    </>
  );
}
