import { islandSchemaType, parseJsonIslandData } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { dbConn } from '@/global/function/db';
import { allDbColumns } from '@/global/function/dbUtility';
import { accessLogger } from '@/global/function/logger';
import { grantLoginBonus } from '@/global/function/loginBonus';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const uuid = request.headers.get('x-verified-uuid');
  if (!uuid) {
    return NextResponse.json(
      { error: '島の取得に失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
  using db = dbConn('./src/db/data/main.db');
  const islandData = db.client
    .prepare<string, islandSchemaType & Pick<userSchemaType, 'island_name'>>(
      `SELECT * FROM (
        SELECT
          user.island_name,
          ${allDbColumns(db.client, 'island')},
          RANK() OVER (ORDER BY island.population DESC) AS rank
        FROM
          user INNER JOIN island 
        ON
          user.uuid = island.uuid
          ) AS ranked
        WHERE ranked.uuid = ?;`
    )
    .get(uuid);
  if (islandData === undefined) {
    accessLogger(request).warn(`Internal Server Error: Development uuid=${uuid}`);
    return NextResponse.json({ error: '島の取得に失敗しました。' }, { status: 500 });
  }
  parseJsonIslandData(islandData, false);

  const loginBonus = grantLoginBonus(uuid, islandData);

  return NextResponse.json({ ...islandData, loginBonus });
}
