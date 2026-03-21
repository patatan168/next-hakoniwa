/**
 * @module admin/(panel)/moderators/new/page-client
 * @description moderator 新規登録フォーム。
 */
'use client';

import Button from '@/global/component/Button';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { fetcher } from '@/global/function/fetch/fetch';
import { adminModeratorCreateForm, adminModeratorCreateSchema } from '@/global/valid/admin';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

const JSON_HEADER = {
  'Content-Type': 'application/json',
};

export default function NewModeratorPageClient() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');

  const form = useForm<adminModeratorCreateForm>({
    defaultValues: {
      id: '',
      password: '',
      passwordConfirm: '',
      userName: '',
    },
    resolver: zodResolver(adminModeratorCreateSchema),
  });

  const onCreateModerator = form.handleSubmit(async (values) => {
    setBusy(true);
    setMessage('');

    try {
      await fetcher('/api/admin/moderators', {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify(values),
      });
      form.reset();
      setMessage('moderator を登録しました。初回ログイン時に資格情報変更が必要です。');
    } catch (e) {
      setMessage((e as Error).message || 'moderator の登録に失敗しました。');
    } finally {
      setBusy(false);
    }
  });

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <h1 className="mb-2 text-2xl font-bold">モデレーターの新規登録</h1>
      <p className="mb-6 text-sm text-gray-600">
        この画面は admin 権限専用です。登録されるロールは moderator 固定です。
      </p>
      {message && <p className="mb-4 rounded-md bg-amber-100 p-3 text-amber-800">{message}</p>}

      <form onSubmit={onCreateModerator} className="space-y-3 rounded-lg border bg-white p-4">
        <TextFieldRHF
          required
          name="id"
          pattern="^[a-zA-Z0-9]+$"
          autoComplete="off"
          control={form.control}
          id="admin-create-moderator-id"
          placeholder="moderator ID"
          isBottomSpace={true}
        />
        <TextFieldRHF
          required
          name="password"
          autoComplete="off"
          control={form.control}
          type="password"
          id="admin-create-moderator-password"
          placeholder="moderator Password"
          isBottomSpace={true}
        />
        <TextFieldRHF
          required
          name="passwordConfirm"
          autoComplete="off"
          control={form.control}
          type="password"
          id="admin-create-moderator-password-confirm"
          placeholder="moderator Password(確認)"
          isBottomSpace={true}
        />
        <TextFieldRHF
          required
          name="userName"
          autoComplete="off"
          control={form.control}
          id="admin-create-moderator-user-name"
          placeholder="moderator ユーザー名"
          isBottomSpace={false}
        />

        <Button type="submit" disabled={busy}>
          モデレーターを登録
        </Button>
      </form>
    </main>
  );
}
