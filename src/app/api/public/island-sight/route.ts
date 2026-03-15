import { db, Island, isSqlite, parseJsonIslandData, User } from '@/db/kysely';
import { uuid25Regex } from '@/global/define/regex';
import { sql } from 'kysely';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const uuid = searchParams.get('uuid') ?? '';
  if (!uuid25Regex.test(uuid)) {
    const response = NextResponse.json(
      { error: 'Invalid Input' },
      {
        status: 400,
      }
    );
    return response;
  }
  if (uuid !== null) {
    const islandDataRaw = await db
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
            'user.inhabited',
            // SQLite: json() で文字列変換が必要、MySQL: JSON 型はそのまま参照
            isSqlite
              ? sql<string>`json(island.island_info)`.as('island_info')
              : sql<string>`island.island_info`.as('island_info'),
            sql<string>`island.prize`.as('prize'),
            sql<number>`RANK() OVER (ORDER BY island.population DESC)`.as('rank'),
          ])
          .where('user.inhabited', '=', 1)
          .as('ranked')
      )
      .selectAll()
      .where('uuid', '=', uuid)
      .executeTakeFirst();
    const islandData = islandDataRaw as unknown as Island & User;
    if (islandData === undefined) {
      return NextResponse.json({ error: 'その島は存在しません。' }, { status: 404 });
    }
    if (islandData.inhabited === undefined) {
      return NextResponse.json({ error: 'その島は無人島です。' }, { status: 410 });
    }

    parseJsonIslandData(islandData, true);

    return NextResponse.json(islandData);
  } else {
    return NextResponse.json({ error: '島の取得に失敗しました。' }, { status: 404 });
  }
}
