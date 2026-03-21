/**
 * @module admin/sign-in-page
 * @description 管理者ログインフォーム。
 */
'use client';

import Button from '@/global/component/Button';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { fetcher } from '@/global/function/fetch/fetch';
import { adminSignInForm, adminSignInSchema } from '@/global/valid/admin';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

const JSON_HEADER = {
  'Content-Type': 'application/json',
};

export default function AdminSignInPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');

  const loginForm = useForm<adminSignInForm>({
    defaultValues: {
      id: '',
      password: '',
    },
    resolver: zodResolver(adminSignInSchema),
  });

  const onSignIn = loginForm.handleSubmit(async (values) => {
    setBusy(true);
    setMessage('');
    try {
      await fetcher('/api/admin/sign-in', {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify(values),
      });
      loginForm.reset();
      router.replace('/admin/log');
    } catch (e) {
      setMessage((e as Error).message || 'ログインに失敗しました。');
    } finally {
      setBusy(false);
    }
  });

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">管理者ログイン</h1>
      <p className="mb-6 text-sm text-gray-600">
        管理者ID/パスワードでログインしてください。初回ログイン時は資格情報変更が必要です。
      </p>
      {message && <p className="mb-4 rounded-md bg-red-100 p-3 text-red-700">{message}</p>}
      <form onSubmit={onSignIn} className="space-y-3 rounded-lg border bg-white p-4">
        <TextFieldRHF
          required
          name="id"
          pattern="^[a-zA-Z0-9]+$"
          autoComplete="off"
          control={loginForm.control}
          id="admin-login-id"
          placeholder="Admin ID"
          isBottomSpace={true}
        />
        <TextFieldRHF
          required
          name="password"
          autoComplete="off"
          control={loginForm.control}
          type="password"
          id="admin-login-password"
          placeholder="Admin Password"
          isBottomSpace={false}
        />
        <Button type="submit" disabled={busy}>
          ログイン
        </Button>
      </form>
    </main>
  );
}
