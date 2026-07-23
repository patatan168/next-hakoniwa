/**
 * @module public/turn-log
 * @description 公開ターンログを返すAPIルート。
 */
import { db } from '@/db/kysely';
import { uuid25Regex } from '@/global/define/regex';
import { NextRequest, NextResponse } from 'next/server';

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
};

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
  const userUuid = searchParams.get('user_uuid');
  if (userUuid && !uuid25Regex.test(userUuid)) {
    const response = NextResponse.json(
      { error: 'Invalid Input' },
      {
        status: 400,
      }
    );
    return response;
  }

  const query = userUuid
    ? db
        .selectFrom('turn_log')
        .select(['log_uuid', 'from_uuid', 'to_uuid', 'turn', 'log'])
        .where('log', 'is not', null)
        .where('log_uuid', '<', logUuid)
        .where((eb) => eb.or([eb('from_uuid', '=', userUuid), eb('to_uuid', '=', userUuid)]))
        .orderBy('log_uuid', 'desc')
    : db
        .selectFrom('turn_log')
        .select(['log_uuid', 'from_uuid', 'to_uuid', 'turn', 'log'])
        .where('log', 'is not', null)
        .where('log_uuid', '<', logUuid)
        .orderBy('log_uuid', 'desc');

  const log = await query.limit(100).execute();
  return NextResponse.json(log, { headers: CACHE_HEADER });
}
