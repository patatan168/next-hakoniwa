/**
 * @module admin/(panel)/users/[uuid]/page-client
 * @description admin専用ユーザー編集画面。
 */
'use client';

import Button from '@/global/component/Button';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { fetcher } from '@/global/function/fetch/fetch';
import {
  adminUserDeleteForm,
  adminUserDeleteSchema,
  adminUserIslandUpdateForm,
  adminUserIslandUpdateSchema,
} from '@/global/valid/admin';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

type AdminUserDetail = {
  uuid: string;
  userName: string;
  islandName: string;
  money: number;
  food: number;
  isLocked: boolean;
};

type AdminUserDetailPageClientProps = {
  targetUuid: string;
};

const JSON_HEADER = {
  'Content-Type': 'application/json',
};

export default function AdminUserDetailPageClient({
  targetUuid,
}: Readonly<AdminUserDetailPageClientProps>) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);

  const updateForm = useForm<adminUserIslandUpdateForm>({
    defaultValues: {
      islandName: '',
      money: 0,
      food: 0,
    },
    resolver: zodResolver(adminUserIslandUpdateSchema),
  });

  const deleteForm = useForm<adminUserDeleteForm>({
    defaultValues: {
      confirmIslandName: '',
    },
    resolver: zodResolver(adminUserDeleteSchema),
  });

  const loadDetail = useCallback(async () => {
    const res = await fetcher<AdminUserDetail>(`/api/admin/users/${targetUuid}`, {
      method: 'GET',
    });

    setDetail(res);
    updateForm.reset({
      islandName: res.islandName,
      money: res.money,
      food: res.food,
    });
  }, [targetUuid, updateForm]);

  useEffect(() => {
    loadDetail().catch((e: Error) => {
      setMessage(e.message || 'ユーザー情報の取得に失敗しました。');
    });
  }, [loadDetail]);

  const onSubmitUpdate = updateForm.handleSubmit(async (values) => {
    setBusy(true);
    setMessage('');

    try {
      await fetcher(`/api/admin/users/${targetUuid}/island`, {
        method: 'PATCH',
        headers: JSON_HEADER,
        body: JSON.stringify(values),
      });
      await loadDetail();
      setMessage('島情報を更新しました。');
    } catch (e) {
      setMessage((e as Error).message || '島情報の更新に失敗しました。');
    } finally {
      setBusy(false);
    }
  });

  const onSubmitDelete = deleteForm.handleSubmit(async (values) => {
    const confirmed = window.confirm(
      'このユーザーを削除します。取り消しできません。実行しますか？'
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage('');

    try {
      await fetcher(`/api/admin/users/${targetUuid}`, {
        method: 'DELETE',
        headers: JSON_HEADER,
        body: JSON.stringify(values),
      });
      window.location.href = '/admin/users';
    } catch (e) {
      setMessage((e as Error).message || 'ユーザー削除に失敗しました。');
      setBusy(false);
    }
  });

  if (!detail) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <p className="text-gray-700">読み込み中...</p>
        {message && <p className="mt-4 rounded-md bg-amber-100 p-3 text-amber-800">{message}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ユーザー編集</h1>
        <Link
          href="/admin/users"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          一覧へ戻る
        </Link>
      </div>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">対象ユーザー</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">ユーザー名</dt>
            <dd className="font-semibold text-gray-900">{detail.userName}</dd>
          </div>
          <div>
            <dt className="text-gray-500">ロック状態</dt>
            <dd className="font-semibold text-gray-900">
              {detail.isLocked ? 'ロック中' : '利用可能'}
            </dd>
          </div>
        </dl>
      </section>

      {message && <p className="rounded-md bg-amber-100 p-3 text-amber-800">{message}</p>}

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">島名と資源の変更</h2>
        <form onSubmit={onSubmitUpdate} className="space-y-3">
          <TextFieldRHF
            required
            name="islandName"
            control={updateForm.control}
            id="admin-user-island-name"
            placeholder="島名"
            isBottomSpace={true}
          />
          <TextFieldRHF
            required
            name="money"
            control={updateForm.control}
            id="admin-user-money"
            type="number"
            placeholder="資金"
            isBottomSpace={true}
          />
          <TextFieldRHF
            required
            name="food"
            control={updateForm.control}
            id="admin-user-food"
            type="number"
            placeholder="食料"
            isBottomSpace={false}
          />
          <Button type="submit" disabled={busy}>
            変更を保存
          </Button>
        </form>
      </section>

      <section className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
        <h2 className="mb-2 text-lg font-semibold text-red-800">ユーザー削除</h2>
        <p className="mb-3 text-sm text-red-700">
          削除を実行すると、対象ユーザーの島は放棄されます。確認のため島名を入力してください。
        </p>
        <form onSubmit={onSubmitDelete} className="space-y-3">
          <TextFieldRHF
            required
            name="confirmIslandName"
            control={deleteForm.control}
            id="admin-user-delete-confirm-island-name"
            placeholder={detail.islandName}
            isBottomSpace={false}
          />
          <Button type="submit" color="red" disabled={busy}>
            ユーザーを削除
          </Button>
        </form>
      </section>
    </main>
  );
}
