'use client';
import Button from '@/global/component/Button';
import { Modal } from '@/global/component/Modal';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { signUpStore } from '@/global/store/api/sign-up';
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
  userName: '',
  islandName: '',
  passwordConfirm: '',
};

function SignUpForm() {
  const {
    subscribe,
    reset,
    control,
    trigger: formTrig,
    handleSubmit,
    formState: { isValid },
  } = useForm<userInfo>({
    defaultValues,
    resolver: zodResolver(userInfoSchema),
  });
  const [body, setBody] = useState(JSON.stringify(defaultValues));
  const { fetch } = useClientFetch(signUpStore);

  const onSubmit = () => {
    fetch({ ...POST_HEADER, body: body });
    reset();
  };

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        setBody(JSON.stringify(values));
      },
    });

    return () => unsubscribe();
  }, [subscribe]);

  useEffect(() => {
    formTrig();
  }, [body]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ul style={{ width: '600px', listStyleType: 'none' }}>
        <li>
          <Button className="mb-4" disabled={!isValid} type="submit">
            新規登録
          </Button>
        </li>
        <li>
          <TextFieldRHF
            required
            style={{ width: '600px' }}
            name="userName"
            control={control}
            id="user-name"
            placeholder="User Name"
          />
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
    </form>
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
