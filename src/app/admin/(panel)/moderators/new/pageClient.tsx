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
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

const JSON_HEADER = {
  'Content-Type': 'application/json',
};

type ModeratorSummary = {
  uuid: string;
  userName: string;
  mustChangeCredentials: boolean;
  isLocked: boolean;
};

type ModeratorsResponse = {
  moderators: ModeratorSummary[];
};

export default function NewModeratorPageClient() {
  const [busy, setBusy] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState<string>('');
  const [moderators, setModerators] = useState<ModeratorSummary[]>([]);
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

  const loadModerators = async () => {
    const res = await fetcher<ModeratorsResponse>('/api/admin/moderators', {
      method: 'GET',
    });
    setModerators(res.moderators);
  };

  useEffect(() => {
    loadModerators().catch((e: Error) => {
      setMessage(e.message || 'モデレーター一覧の取得に失敗しました。');
    });
  }, []);

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
      await loadModerators();
      setMessage('moderator を登録しました。初回ログイン時に資格情報変更が必要です。');
    } catch (e) {
      setMessage((e as Error).message || 'moderator の登録に失敗しました。');
    } finally {
      setBusy(false);
    }
  });

  const onDeleteModerator = async (moderator: ModeratorSummary) => {
    if (busy || deletingUuid) return;

    const confirmed = window.confirm(
      `モデレーター「${moderator.userName}」を削除します。よろしいですか？`
    );
    if (!confirmed) return;

    setDeletingUuid(moderator.uuid);
    setMessage('');

    try {
      await fetcher(`/api/admin/moderators/${moderator.uuid}`, {
        method: 'DELETE',
      });
      await loadModerators();
      setMessage('モデレーターを削除しました。');
    } catch (e) {
      setMessage((e as Error).message || 'モデレーターの削除に失敗しました。');
    } finally {
      setDeletingUuid('');
    }
  };

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

      <section className="mt-8">
        <h2 className="mb-2 text-xl font-bold">モデレーター一覧（削除）</h2>
        <p className="mb-3 text-sm text-gray-600">管理機能は削除のみ提供します。</p>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-700">
              <tr>
                <th className="px-3 py-2">ユーザー名</th>
                <th className="px-3 py-2">初回変更</th>
                <th className="px-3 py-2">ロック状態</th>
                <th className="px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {moderators.map((moderator) => (
                <tr key={moderator.uuid} className="border-t">
                  <td className="px-3 py-2">{moderator.userName}</td>
                  <td className="px-3 py-2">{moderator.mustChangeCredentials ? '必要' : '不要'}</td>
                  <td className="px-3 py-2">{moderator.isLocked ? 'ロック中' : '利用可能'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onDeleteModerator(moderator)}
                      disabled={busy || deletingUuid === moderator.uuid}
                      className="rounded-md bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {moderators.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-gray-500" colSpan={4}>
                    モデレーターが見つかりません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
