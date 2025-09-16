import { redirect } from 'next/navigation';
import MapSight from './MapSight';

export default async function Page({ searchParams }: PageProps<'/sight'>) {
  const { uuid } = await searchParams;
  if (!uuid || Array.isArray(uuid)) {
    const encodedMessage = encodeURIComponent('島のUUIDが指定されてないか不正です。');
    redirect(`/error/404?message=${encodedMessage}`);
  }

  return (
    <>
      <MapSight uuid={uuid} />
    </>
  );
}
