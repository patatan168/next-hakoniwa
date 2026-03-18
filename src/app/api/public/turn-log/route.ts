/**
 * @module public/turn-log
 * @description 公開ターンログを返すAPIルート。
 */
import { db, isSqlite } from '@/db/kysely';
import { uuid25Regex } from '@/global/define/regex';
import { sql } from 'kysely';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const logUuid = searchParams.get('log_uuid') ?? 'zzzzzzzzzzzzzzzzzzzzzzzzz';
  if (!uuid25Regex.test(logUuid)) {
    const response = NextResponse.json(
      { error: 'Invalid Input' },
      {
        status: 400,
      }
    );
    return response;
  }

  let query = db
    .selectFrom('turn_log')
    .select(['log_uuid', 'from_uuid', 'to_uuid', 'turn', 'log'])
    .where('log', 'is not', null);

  if (isSqlite) {
    query = query.where('log_uuid', '<', logUuid).orderBy('log_uuid', 'desc');
  } else {
    query = query
      .where(sql<boolean>`BINARY log_uuid < ${logUuid}`)
      .orderBy(sql`BINARY log_uuid`, 'desc');
  }

  const log = await query.limit(100).execute();
  return NextResponse.json(log);
}
