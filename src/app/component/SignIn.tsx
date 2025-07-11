'use client';
import Button from '@/global/component/Button';
import { Modal } from '@/global/component/Modal';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { useFetch, useFetchTrig } from '@/global/function/fetch';
import { signInUserInfo, signInUserInfoSchema } from '@/global/valid/userInfo';
import { zodResolver } from '@hookform/resolvers/zod';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

const POST_HEADER = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const defaultValues: signInUserInfo = {
  id: '',
  password: '',
};

function SignInForm() {
  const {
    watch,
    reset,
    control,
    trigger: formTrig,
    formState: { isValid },
  } = useForm<signInUserInfo>({
    defaultValues,
    resolver: zodResolver(signInUserInfoSchema),
  });
  const body = JSON.stringify(watch());
  const { trigger, data } = useFetchTrig('/api/auth/user/sign-in', {
    ...POST_HEADER,
    body: body,
  });
  const submit = () => {
    trigger();
    reset();
  };

  useEffect(() => {
    formTrig();
  }, [body]);

  // 開発画面へリダイレクト
  useEffect(() => {
    if (data !== undefined) {
      if (typeof data.redirectUrl === 'string') {
        redirect(data.redirectUrl);
      }
    }
  }, [data]);

  return (
    <>
      <ul style={{ width: '600px', listStyleType: 'none' }}>
        <li>
          <Button disabled={!isValid} type="submit" onClick={submit}>
            Sign In
          </Button>
        </li>
        <li>
          <TextFieldRHF
            required
            style={{ width: '600px' }}
            name="id"
            control={control}
            id="user-id"
            placeholder="User Id"
          />
        </li>
        <li>
          <TextFieldRHF
            required
            style={{ width: '600px' }}
            name="password"
            control={control}
            type="password"
            id="password"
            placeholder="Password"
          />
        </li>
      </ul>
    </>
  );
}

export default function SignIn() {
  const [open, setOpen] = useState(false);
  const { data } = useFetch<{ result: boolean }>('/api/auth/session', { method: 'GET' });
  const openToggle = (value: boolean) => {
    if (data?.result) redirect('/development');
    setOpen(value);
  };
  return (
    <>
      <Button
        type="button"
        aria-haspopup="dialog"
        aria-expanded="false"
        onClick={() => openToggle(true)}
      >
        島を開発する
      </Button>
      <Modal
        hidden
        header="島を開発する - サインイン"
        body={<SignInForm />}
        open={open}
        openToggle={openToggle}
      />
    </>
  );
}
