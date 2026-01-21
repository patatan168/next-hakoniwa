'use client';
import Button from '@/global/component/Button';
import { Modal } from '@/global/component/Modal';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { signInStore } from '@/global/store/api/sign-in';
import { signInUserInfo, signInUserInfoSchema } from '@/global/valid/userInfo';
import { zodResolver } from '@hookform/resolvers/zod';
import { getCookie } from 'cookies-next/client';
import { useRouter } from 'next/navigation';
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

function SignInForm({ open }: { open: boolean }) {
  const {
    subscribe,
    reset,
    control,
    trigger: formTrig,
    handleSubmit,
    formState: { isValid },
  } = useForm<signInUserInfo>({
    defaultValues,
    resolver: zodResolver(signInUserInfoSchema),
  });
  const router = useRouter();
  const [body, setBody] = useState(JSON.stringify(defaultValues));
  const { fetch, data } = useClientFetch(signInStore);

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

  // 開発画面へリダイレクト
  useEffect(() => {
    const tmpCookie = getCookie('refresh_token');
    if (data.post?.result && open && tmpCookie) router.push('/development');
  }, [data.post, open]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ul style={{ width: '600px', listStyleType: 'none' }}>
        <li>
          <Button className="mb-4" disabled={!isValid} type="submit">
            島を開発する
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
    </form>
  );
}

export default function SignIn() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const openToggle = (value: boolean) => {
    const tmpCookie = getCookie('refresh_token');
    if (tmpCookie) return router.push('/development');
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
        body={<SignInForm open={open} />}
        open={open}
        openToggle={openToggle}
      />
    </>
  );
}
