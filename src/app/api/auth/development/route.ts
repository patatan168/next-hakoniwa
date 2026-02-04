import { islandSchemaType, parseJsonIslandData } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { dbConn } from '@/global/function/db';
import { allDbColumns } from '@/global/function/dbUtility';
import { accessLogger } from '@/global/function/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const uuid = request.headers.get('x-verified-uuid');
  if (!uuid) {
    accessLogger(request).warn(`Unauthorized Development`);
    return NextResponse.json(
      { error: '島の取得に失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
  using db = dbConn('./src/db/data/main.db');
  accessLogger(request).info(`Request Development uuid=${uuid}`);
  const islandData = db.client
    .prepare<string, islandSchemaType & Pick<userSchemaType, 'island_name'>>(
      `SELECT
          user.island_name,
          ${allDbColumns(db.client, 'island')},
          RANK() OVER (ORDER BY island.population DESC) AS rank
        FROM
          user INNER JOIN island 
        ON
          user.uuid = island.uuid
        WHERE
          island.uuid=?`
    )
    .get(uuid);
  if (islandData === undefined) {
    return NextResponse.json(
      { error: '島の取得に失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
  parseJsonIslandData(islandData, false);
  return NextResponse.json(islandData);
}
