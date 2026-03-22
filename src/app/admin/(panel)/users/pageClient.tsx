/**
 * @module admin/(panel)/users/page-client
 * @description ユーザー管理一覧のクライアント実装。
 */
'use client';

import { hasFullModeratorPermission } from '@/global/define/moderatorRole';
import { fetcher } from '@/global/function/fetch/fetch';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type UserSummary = {
  uuid: string;
  userName: string;
  islandName: string;
  isLocked: boolean;
};

type UsersResponse = {
  adminRole: number;
  users: UserSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  keyword: string;
};

const JSON_HEADER = {
  'Content-Type': 'application/json',
};

const PAGE_SIZE = 20;

export default function AdminUsersPageClient() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [adminRole, setAdminRole] = useState<number>(-1);
  const [keywordInput, setKeywordInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const canEdit = useMemo(() => hasFullModeratorPermission(adminRole), [adminRole]);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      keyword: searchKeyword,
    });

    const res = await fetcher<UsersResponse>(`/api/admin/users?${params.toString()}`, {
      method: 'GET',
    });

    setAdminRole(res.adminRole);
    setUsers(res.users);
    setTotal(res.total);
    setTotalPages(res.totalPages);
    setPage(res.page);
  }, [page, searchKeyword]);

  useEffect(() => {
    loadUsers().catch((e: Error) => {
      setMessage(e.message || 'ユーザー一覧の取得に失敗しました。');
    });
  }, [loadUsers]);

  const onToggleLock = async (user: UserSummary) => {
    if (busy) return;

    const nextLocked = !user.isLocked;
    const confirmed = window.confirm(
      nextLocked
        ? `ユーザー「${user.userName}」をロックします。よろしいですか？`
        : `ユーザー「${user.userName}」のロックを解除します。よろしいですか？`
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage('');

    try {
      await fetcher(`/api/admin/users/${user.uuid}/lock`, {
        method: 'PATCH',
        headers: JSON_HEADER,
        body: JSON.stringify({ locked: nextLocked }),
      });
      await loadUsers();
      setMessage(nextLocked ? 'ユーザーをロックしました。' : 'ユーザーのロックを解除しました。');
    } catch (e) {
      setMessage((e as Error).message || 'ロック状態の更新に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  const onSubmitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchKeyword(keywordInput.trim());
  };

  const onClickPrev = () => {
    if (page <= 1) return;
    setPage((prev) => prev - 1);
  };

  const onClickNext = () => {
    if (page >= totalPages) return;
    setPage((prev) => prev + 1);
  };

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="mb-2 text-2xl font-bold">ユーザー管理</h1>
      <p className="mb-6 text-sm text-gray-600">
        moderator はユーザー名・島名の確認とロック操作が可能です。admin
        は追加で編集と削除が可能です。
      </p>

      {message && <p className="mb-4 rounded-md bg-amber-100 p-3 text-amber-800">{message}</p>}

      <form onSubmit={onSubmitSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="ユーザー名 / 島名で検索"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          検索
        </button>
      </form>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
        <p>
          表示件数: {users.length}件 / 全{total}件
        </p>
        <p>
          {page} / {totalPages} ページ
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-700">
            <tr>
              <th className="px-3 py-2">ユーザー名</th>
              <th className="px-3 py-2">島名</th>
              <th className="px-3 py-2">ロック状態</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uuid} className="border-t">
                <td className="px-3 py-2">{user.userName}</td>
                <td className="px-3 py-2">{user.islandName}</td>
                <td className="px-3 py-2">
                  {user.isLocked ? (
                    <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                      ロック中
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      利用可能
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onToggleLock(user)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${user.isLocked ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'}`}
                    >
                      {user.isLocked ? 'ロック解除' : 'ロック'}
                    </button>
                    {canEdit && (
                      <Link
                        href={`/admin/users/${user.uuid}`}
                        className="rounded-md border border-sky-700 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                      >
                        編集
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-gray-500" colSpan={4}>
                  ユーザーが見つかりません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onClickPrev}
          disabled={page <= 1}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          前へ
        </button>
        <button
          type="button"
          onClick={onClickNext}
          disabled={page >= totalPages}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </main>
  );
}
