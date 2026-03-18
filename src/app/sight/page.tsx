/**
 * @module sight/page
 * @description 島閲覧ページ。
 */
import { redirect } from 'next/navigation';
import MapSight from './MapSight';

export default async function Page({ searchParams }: PageProps<'/sight'>) {
  const { uuid, create } = await searchParams;
  if (!uuid || Array.isArray(uuid)) {
    const encodedMessage = encodeURIComponent(
      '島のUUIDが指定されてないか、無人島になったようです。'
    );
    redirect(`/error/404?message=${encodedMessage}`);
  }

  return (
    <>
      <MapSight uuid={uuid} create={create === 'true'} />
    </>
  );
}
