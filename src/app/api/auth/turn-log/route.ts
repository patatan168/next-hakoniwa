/**
 * @module auth/turn-log
 * @description 認証済みユーザー向けターンログを返すAPIルート。
 */
import { db } from '@/db/kysely';
import { uuid25Regex } from '@/global/define/regex';
import { sql } from 'kysely';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const uuid = request.headers.get('x-verified-uuid');
  if (!uuid) {
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
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

  const log = await sql<{
    log_uuid: string;
    from_uuid: string;
    to_uuid: string | null;
    turn: number;
    secret_log: string;
  }>`
    SELECT log_uuid, from_uuid, to_uuid, turn, secret_log
    FROM (
      SELECT log_uuid, from_uuid, to_uuid, turn, secret_log
      FROM turn_log
      WHERE from_uuid = ${uuid}
        AND log_uuid < ${logUuid}
      UNION ALL
      SELECT log_uuid, from_uuid, to_uuid, turn, secret_log
      FROM turn_log
      WHERE to_uuid = ${uuid}
        AND from_uuid <> ${uuid}
        AND log_uuid < ${logUuid}
    ) AS merged
    ORDER BY log_uuid DESC
    LIMIT 100
  `.execute(db);

  return NextResponse.json(log.rows);
}
