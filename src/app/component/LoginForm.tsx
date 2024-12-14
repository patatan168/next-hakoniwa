'use client';
import Button from '@/global/component/Button';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { useFetchTrig } from '@/global/function/fetch';
import { userInfo, userInfoSchema } from '@/global/valid/userInfo';
import { zodResolver } from '@hookform/resolvers/zod';
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
      <ul>
        <li>
          <Button
            type="submit"
            onClick={() => {
              trigger();
              reset();
            }}
          >
            Post
          </Button>
        </li>
        <li>
          <TextFieldRHF
            required
            name="islandName"
            control={control}
            id="island-name"
            placeholder="Island Name"
          />
        </li>
        <li>
          <TextFieldRHF required name="id" control={control} id="user-id" placeholder="User Id" />
        </li>
        <li>
          <TextFieldRHF
            required
            name="password"
            control={control}
            type="password"
            id="password"
            placeholder="Password"
          />
        </li>
        <li>
          <TextFieldRHF
            required
            name="passwordConfirm"
            control={control}
            type="password"
            id="password-confirm"
            placeholder="Password (Confirm)"
          />
        </li>
      </ul>
    </>
  );
}
