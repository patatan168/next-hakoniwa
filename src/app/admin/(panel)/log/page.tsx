/**
 * @module admin/(panel)/log/page
 * @description 管理者ログ画面（サーバー側で初期状態を組み立てる）。
 */
import { db } from '@/db/kysely';
import { validModeratorSession } from '@/global/function/moderatorAuth';
import { redirect } from 'next/navigation';
import AdminLogPageClient from './logPageClient';

export default async function AdminLogPage() {
  const adminUuid = await validModeratorSession(db);
  if (!adminUuid) {
    redirect('/error/401');
  }

  const admin = await db
    .selectFrom('moderator_auth')
    .select(['must_change_credentials', 'role', 'user_name'])
    .where('uuid', '=', adminUuid)
    .executeTakeFirst();

  if (!admin) {
    redirect('/error/401');
  }

  return (
    <AdminLogPageClient
      initialMustChangeCredentials={admin.must_change_credentials === 1}
      initialRole={admin.role}
      initialUserName={admin.user_name}
    />
  );
}
