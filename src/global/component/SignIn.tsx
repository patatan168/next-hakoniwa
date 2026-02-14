'use client';
import Button from '@/global/component/Button';
import Modal from '@/global/component/Modal';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { signInStore } from '@/global/store/api/sign-in';
import { signInUserInfo, signInUserInfoSchema } from '@/global/valid/userInfo';
import { sanitizeJsonStringify } from '@/global/valid/xss';
import { zodResolver } from '@hookform/resolvers/zod';
import { getCookie } from 'cookies-next/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { IoSendSharp } from 'react-icons/io5';
import { PiIslandFill } from 'react-icons/pi';

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

function SignInForm({ open, openToggle }: { open: boolean; openToggle: (value: boolean) => void }) {
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
  const { fetch, data, error } = useClientFetch(signInStore);

  const onSubmit = () => {
    fetch({ ...POST_HEADER, body: body });
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

  // 開発画面へリダイレクト
  useEffect(() => {
    const tmpCookie = getCookie('refresh_token');
    if (data.post?.result && open && tmpCookie) {
      reset();
      openToggle(false);
      router.push('/development');
    }
  }, [data.post, open]);

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
            島を開発する
          </Button>
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
            isBottomSpace={true}
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
            isBottomSpace={true}
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
    if (tmpCookie && value) return router.push('/development');
    setOpen(value);
  };
  return (
    <>
      <Button
        size="xs"
        className="w-full sm:text-sm md:text-sm lg:text-base 2xl:px-48"
        type="button"
        color="teal"
        aria-haspopup="dialog"
        aria-expanded="false"
        onClick={() => openToggle(true)}
        icons={<PiIslandFill />}
      >
        島を開発
      </Button>
      <Modal
        hidden
        header="島を開発する - サインイン"
        body={<SignInForm open={open} openToggle={openToggle} />}
        open={open}
        openToggle={openToggle}
      />
    </>
  );
}
