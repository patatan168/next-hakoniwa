/**
 * @module SignUp
 * @description サインアップフォームコンポーネント。新規アカウント登録を行う。
 */
'use client';
import Button from '@/global/component/Button';
import Modal from '@/global/component/Modal';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { signUpStore } from '@/global/store/api/sign-up';
import { signUpAvailabilityStore } from '@/global/store/api/sign-up-availability';
import { userInfo, userInfoSchema } from '@/global/valid/userInfo';
import { sanitizeJsonStringify } from '@/global/valid/xss';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { IoSendSharp } from 'react-icons/io5';

/**
 * フィンガープリントを生成する
 * 収集項目: UA / タイムゾーン / 言語 / CPUコア数 / 画面情報 / プラットフォーム
 * クライアント内でSHA-256ハッシュ化、生データはサーバーに送信しない
 */
async function buildFpHash(): Promise<string> {
  const raw = JSON.stringify({
    ua: navigator.userAgent,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: navigator.language,
    cpu: navigator.hardwareConcurrency,
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    platform: navigator.platform,
  });
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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
  const router = useRouter();
  const [body, setBody] = useState(JSON.stringify(defaultValues));
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { fetch, data, error } = useClientFetch(signUpStore);

  const onSubmit = async () => {
    const fpHash = await buildFpHash();
    fetch({
      ...POST_HEADER,
      headers: { ...POST_HEADER.headers, 'x-fp-hash': fpHash },
      body,
    });
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

  // 登録成功時に観光画面へリダイレクト
  useEffect(() => {
    const post = data.post as { result?: boolean; uuid?: string } | undefined;
    if (post?.result && post.uuid) {
      reset();
      router.push(`/sight?uuid=${post.uuid}&create=true`);
    }
  }, [data.post]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ul className="w-[500px] max-w-full list-none">
        <li>
          {error.post && (
            <p className="mb-4 rounded-md bg-red-100 p-3 text-red-700">{error.post.detail}</p>
          )}
        </li>
        <li className="mb-3 flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <input
            type="checkbox"
            id="agree-to-terms"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-blue-600"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
          />
          <label htmlFor="agree-to-terms" className="cursor-pointer text-sm text-gray-600">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              利用規約
            </a>
            （Cookie・フィンガープリントの使用を含む）に同意する
          </label>
        </li>
        <li className="flex justify-end">
          <Button
            className="mb-4"
            disabled={!isValid || !agreeToTerms}
            type="submit"
            icons={<IoSendSharp />}
          >
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
            isBottomSpace={true}
          />
        </li>
        <li>
          <TextFieldRHF
            required
            name="islandName"
            control={control}
            id="island-name"
            placeholder="Island Name"
            isBottomSpace={true}
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
            isBottomSpace={true}
          />
        </li>
      </ul>
    </form>
  );
}

export default function SignUp() {
  const [open, setOpen] = useState(false);
  const {
    data: availabilityData,
    error: availabilityError,
    fetch: fetchAvailability,
    isLoading: isAvailabilityLoading,
  } = useClientFetch(signUpAvailabilityStore);

  const canSignUp = availabilityData.get?.canSignUp ?? true;
  const signUpMessage = availabilityData.get?.message ?? availabilityError.get?.detail;
  const isModalOpen = open && canSignUp;

  const openToggle = (value: boolean) => {
    setOpen(value);
  };

  const onOpen = async () => {
    await fetchAvailability({ method: 'GET', cache: 'no-store' });
    const latest = signUpAvailabilityStore.getState();

    // 可否チェックに失敗した場合は入力自体は許可し、POST側の判定に委ねる
    if (latest.error.get) {
      openToggle(true);
      return;
    }

    if (latest.data.get?.canSignUp === false) return;
    openToggle(true);
  };

  return (
    <>
      <div className="flex flex-col items-end">
        <Button
          size="xs"
          className="sm:text-sm"
          type="button"
          category="outline"
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          disabled={isAvailabilityLoading.get}
          title={!canSignUp ? signUpMessage : undefined}
          onClick={onOpen}
        >
          {canSignUp ? '新規登録' : '新規登録停止中'}
        </Button>
        {!canSignUp && signUpMessage && (
          <p className="mt-1 max-w-52 text-right text-[11px] leading-tight text-red-700 sm:text-xs">
            {signUpMessage}
          </p>
        )}
      </div>
      <Modal
        hidden
        header="島を探す - 新規登録"
        body={<SignUpForm />}
        open={isModalOpen}
        openToggle={openToggle}
      />
    </>
  );
}
