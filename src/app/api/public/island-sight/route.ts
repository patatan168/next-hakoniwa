import { islandSchemaType, parseJsonIslandData } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { uuid25Regex } from '@/global/define/regex';
import { dbConn } from '@/global/function/db';
import { allDbColumns } from '@/global/function/dbUtility';
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
  using db = dbConn('./src/db/data/main.db');
  if (uuid !== null) {
    const islandData = db.client
      .prepare<string, islandSchemaType & userSchemaType>(
        `SELECT
          ${allDbColumns(db.client, 'user')}
          ${allDbColumns(db.client, 'island')}
        FROM
          user INNER JOIN island 
        ON
          user.uuid = island.uuid
        WHERE
          island.uuid = ? AND user.inhabited = 1;`
      )
      .get(uuid);
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
