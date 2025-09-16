import { islandSchemaType, parseJsonIslandData } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { dbConn } from '@/global/function/db';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const getId = searchParams.get('uuid');
  using db = dbConn('./src/db/data/main.db');
  if (getId !== null) {
    const islandData = db.client
      .prepare<string, islandSchemaType & Pick<userSchemaType, 'island_name'>>(
        `SELECT
          island.uuid, user.island_name,
          json(island.prize) as prize,
          island.money, island.food,
          island.area, island.population,
          island.farm, island.factory, island.mining,
          json(island.island_info) as island_info
        FROM
          user INNER JOIN island 
        ON
          user.uuid = island.uuid
        WHERE
          island.uuid = ? AND user.inhabited = 1;`
      )
      .get(getId);
    if (islandData === undefined) {
      return NextResponse.json({ error: '島の取得に失敗しました。' }, { status: 404 });
    }
    parseJsonIslandData(islandData, true);
    return NextResponse.json(islandData);
  } else {
    return NextResponse.json({ error: '島の取得に失敗しました。' }, { status: 404 });
  }
}
