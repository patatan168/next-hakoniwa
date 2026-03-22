/**
 * @module admin/(panel)/layout
 * @description 管理者ページ共通レイアウト（/admin は除く）。
 */
import { db } from '@/db/kysely';
import { resolveModeratorRoleName } from '@/global/define/moderatorRole';
import { validModeratorSession } from '@/global/function/moderatorAuth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import SignOutButton from './signOutButton';

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adminUuid = await validModeratorSession(db);
  if (!adminUuid) {
    redirect('/error/401');
  }

  const admin = await db
    .selectFrom('moderator_auth')
    .select(['user_name', 'role'])
    .where('uuid', '=', adminUuid)
    .executeTakeFirst();

  if (!admin) {
    redirect('/error/401');
  }

  const roleName = resolveModeratorRoleName(admin.role);

  return (
    <main className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">管理者ページ</h1>
          <p className="text-sm text-gray-600">
            ユーザー名: {admin.user_name} / 権限: {roleName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/users"
            className="rounded-lg border border-sky-700 bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          >
            ユーザー管理
          </Link>
          <Link
            href="/admin/log"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ログ管理
          </Link>
          <Link
            href="/admin/moderators/new"
            className="rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            モデレーターの新規登録
          </Link>
          <SignOutButton />
        </div>
      </div>
      {children}
    </main>
  );
}
