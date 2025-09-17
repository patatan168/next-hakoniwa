import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { dbConn } from '@/global/function/db';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  using db = dbConn('./src/db/data/main.db');
  const getId = searchParams.get('log_uuid') ?? 'zzzzzzzzzzzzzzzzzzzzzzzzz';

  const log = db.client
    .prepare<
      string,
      turnLogSchemaType
    >('SELECT log_uuid, from_uuid, to_uuid, turn, secret_log, log FROM turn_log WHERE log_uuid < ? ORDER BY log_uuid DESC LIMIT 100;')
    .all(getId);
  return NextResponse.json(log);
}
