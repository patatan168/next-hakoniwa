import { islandSchemaType, parseJsonIslandData } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { allDbColumns } from '@/global/function/dbUtility';
import { accessLogger } from '@/global/function/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const uuid = await validAuthCookie(db.client);
  if (uuid !== undefined) {
    accessLogger(request).info(`Request Development uuid=${uuid}`);
    const islandData = db.client
      .prepare<string, islandSchemaType & Pick<userSchemaType, 'island_name'>>(
        `SELECT
          user.island_name,
          ${allDbColumns(db.client, 'island')}
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
  } else {
    accessLogger(request).warn(`Unauthorized Development`);
    return NextResponse.json(
      { error: '島の取得に失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
}
