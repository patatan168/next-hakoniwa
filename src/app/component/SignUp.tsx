'use client';
import Button from '@/global/component/Button';
import { Modal } from '@/global/component/Modal';
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

function SignUpForm() {
  const {
    watch,
    reset,
    control,
    trigger: formTrig,
    formState: { isValid },
  } = useForm<userInfo>({
    defaultValues,
    resolver: zodResolver(userInfoSchema, { async: true }, { mode: 'async' }),
  });
  const body = JSON.stringify(watch());
  const { trigger } = useFetchTrig('/api/auth/user', {
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

  return (
    <>
      <ul style={{ width: '600px', listStyleType: 'none' }}>
        <li>
          <Button disabled={!isValid} type="submit" onClick={submit}>
            Post
          </Button>
        </li>
        <li>
          <TextFieldRHF
            required
            style={{ width: '600px' }}
            name="islandName"
            control={control}
            id="island-name"
            placeholder="Island Name"
          />
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
        <li>
          <TextFieldRHF
            required
            style={{ width: '600px' }}
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

export default function SignUp() {
  const [open, setOpen] = useState(false);
  const openToggle = (value: boolean) => {
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
        新規登録
      </Button>
      <Modal
        hidden
        header="島を探す - 新規登録"
        body={<SignUpForm />}
        open={open}
        openToggle={openToggle}
      />
    </>
  );
}
