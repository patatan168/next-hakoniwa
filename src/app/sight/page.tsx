/**
 * @module sight/page
 * @description 島閲覧ページ。
 */
'use server';
import { db, islandInfoData, isSqlite, parseJsonIslandData } from '@/db/kysely';
import { uuid25Regex } from '@/global/define/regex';
import { sql } from 'kysely';
import { redirect } from 'next/navigation';
import MapSight from './MapSight';

export default async function Page({ searchParams }: PageProps<'/sight'>) {
  const { uuid, create } = await searchParams;
  if (!uuid || Array.isArray(uuid)) {
    const encodedMessage = encodeURIComponent('島のUUIDが指定されてないようです。');
    redirect(`/error/404?message=${encodedMessage}`);
  }
  if (!uuid25Regex.test(uuid)) {
    const encodedMessage = encodeURIComponent('不正なUUIDが指定されました。');
    redirect(`/error/400?message=${encodedMessage}`);
  }

  const islandData = await db
    .selectFrom((eb) =>
      eb
        .selectFrom('user')
        .innerJoin('island', 'user.uuid', 'island.uuid')
        .select([
          'island.uuid',
          'island.money',
          'island.area',
          'island.population',
          'island.food',
          'island.farm',
          'island.factory',
          'island.mining',
          'island.missile',
          'user.island_name_prefix',
          'user.island_name',
          'user.user_name',
          'user.inhabited',
          // SQLite: json() で文字列変換が必要、MySQL: JSON 型はそのまま参照
          isSqlite
            ? sql<islandInfoData>`json(island.island_info)`.as('island_info')
            : sql<islandInfoData>`island.island_info`.as('island_info'),
          sql<string>`island.prize`.as('prize'),
          sql<number>`RANK() OVER (ORDER BY island.population DESC)`.as('rank'),
        ])
        .where('user.inhabited', '=', 1)
        .as('ranked')
    )
    .selectAll()
    .where('uuid', '=', uuid)
    .executeTakeFirst();
  if (!islandData || islandData.inhabited === 0) {
    const encodedMessage = encodeURIComponent('その島は無人島になったか、存在しない島のようです。');
    redirect(`/error/404?message=${encodedMessage}`);
  }
  // NOTE: ここで、公開情報として資金も丸めている
  parseJsonIslandData(islandData, true);

  return (
    <>
      <MapSight islandData={islandData} uuid={uuid} create={create === 'true'} />
    </>
  );
}
