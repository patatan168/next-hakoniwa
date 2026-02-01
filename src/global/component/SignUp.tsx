'use client';
import Button from '@/global/component/Button';
import { Modal } from '@/global/component/Modal';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { signUpStore } from '@/global/store/api/sign-up';
import { userInfo, userInfoSchema } from '@/global/valid/userInfo';
import { sanitizeJsonStringify } from '@/global/valid/xss';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { IoSendSharp } from 'react-icons/io5';

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
  const { fetch, error } = useClientFetch(signUpStore);

  const onSubmit = () => {
    fetch({ ...POST_HEADER, body: body });
    reset();
  };

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        setBody(sanitizeJsonStringify(values));
      },
    });

    return () => unsubscribe();
  }, [subscribe]);

  useEffect(() => {
    formTrig();
  }, [body]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ul style={{ listStyleType: 'none' }} className="w-[500] max-w-[96vw]">
        <li>
          {error.post && (
            <p className="mb-4 rounded-md bg-red-100 p-3 text-red-700">{error.post.detail}</p>
          )}
        </li>
        <li className="flex justify-end">
          <Button className="mb-4" disabled={!isValid} type="submit" icons={<IoSendSharp />}>
            新規登録
          </Button>
        </li>
        <li>
          <TextFieldRHF
            required
            name="userName"
            control={control}
            id="user-name"
            placeholder="User Name"
          />
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
          <TextFieldRHF
            required
            name="id"
            pattern="^[a-zA-Z0-9]+$"
            autoComplete="off"
            control={control}
            id="user-id"
            placeholder="User Id"
          />
        </li>
        <li>
          <TextFieldRHF
            required
            name="password"
            pattern="^[\x00-\x7F]+$"
            autoComplete="off"
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
            pattern="^[\x00-\x7F]+$"
            autoComplete="off"
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
        size="xs"
        className="sm:text-sm"
        type="button"
        category="outline"
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
