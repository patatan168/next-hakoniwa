import { islandSchemaType, parseJsonIslandData } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { accessLogger } from '@/global/function/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const response = new NextResponse();
  const uuid = await validAuthCookie(db.client, response, request);
  if (uuid !== undefined) {
    accessLogger(request).info(`Request Development uuid=${uuid}`);
    const islandData = db.client
      .prepare(
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
          island.uuid=?`
      )
      .get(uuid) as islandSchemaType & Pick<userSchemaType, 'island_name'>;
    parseJsonIslandData(islandData, false);
    return NextResponse.json(islandData);
  } else {
    accessLogger(request).warn(`Unauthorized Development`);
    return NextResponse.json(
      { error: '島の取得に失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
}
