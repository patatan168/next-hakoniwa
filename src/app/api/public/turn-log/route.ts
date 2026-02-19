import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { uuid25Regex } from '@/global/define/regex';
import { dbConn } from '@/global/function/db';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const logUuid = searchParams.get('log_uuid') ?? 'ZZZZZZZZZZZZZZZZZZZZZZZZZ';
  if (!uuid25Regex.test(logUuid)) {
    const response = NextResponse.json(
      { error: 'Invalid Input' },
      {
        status: 400,
      }
    );
    return response;
  }

  using db = dbConn('./src/db/data/main.db');
  const log = db.client
    .prepare<
      string,
      turnLogSchemaType
    >('SELECT log_uuid, from_uuid, to_uuid, turn, log FROM turn_log WHERE log_uuid < ? AND log IS NOT NULL ORDER BY log_uuid DESC LIMIT 100;')
    .all(logUuid);
  return NextResponse.json(log);
}
