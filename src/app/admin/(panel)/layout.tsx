/**
 * @module admin/(panel)/layout
 * @description 管理者ページ共通レイアウト（/admin は除く）。
 */
import { db } from '@/db/kysely';
import { validModeratorSession } from '@/global/function/moderatorAuth';
import { redirect } from 'next/navigation';
import SignOutButton from './sign-out-button';

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

  return (
    <main className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">管理者ページ</h1>
          <p className="text-sm text-gray-600">
            ユーザー名: {admin.user_name} / 権限: {admin.role}
          </p>
        </div>
        <SignOutButton />
      </div>
      {children}
    </main>
  );
}
