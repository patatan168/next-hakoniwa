/**
 * @module admin/(panel)/users/[uuid]/page
 * @description admin専用ユーザー編集ページ。
 */
import AdminUserDetailPageClient from './pageClient';

type AdminUserDetailPageProps = {
  params: Promise<{ uuid: string }>;
};

export default async function AdminUserDetailPage({ params }: Readonly<AdminUserDetailPageProps>) {
  const { uuid } = await params;

  return <AdminUserDetailPageClient targetUuid={uuid} />;
}
