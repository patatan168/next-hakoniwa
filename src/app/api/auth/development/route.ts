import { parseJsonIslandData } from '@/db/schema/islandTable';
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
         uuid,island_name,prize,money,area,population,farm,factory,island_name,island_info
         FROM
         island WHERE uuid=?`
      )
      .get(uuid);
    parseJsonIslandData(islandData, false);
    return NextResponse.json(islandData);
  } else {
    accessLogger(request).warn(`Unauthorized Development`);
    return new Response('Unauthorized', { status: 401 });
  }
}
