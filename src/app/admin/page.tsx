/**
 * @module admin/page
 * @description 管理者ログインページ。ログイン済みなら /admin/log に遷移する。
 */
import { db } from '@/db/kysely';
import { validModeratorSession } from '@/global/function/moderatorAuth';
import { redirect } from 'next/navigation';
import AdminSignInPage from './signInPage';

export default async function AdminPage() {
  const uuid = await validModeratorSession(db);
  if (uuid) {
    redirect('/admin/log');
  }

  return <AdminSignInPage />;
}
