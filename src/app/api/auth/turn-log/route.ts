import { db } from '@/db/kysely';
import { uuid25Regex } from '@/global/define/regex';
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

  const log = await db
    .selectFrom('turn_log')
    .select(['log_uuid', 'from_uuid', 'to_uuid', 'turn', 'secret_log'])
    .where('log_uuid', '<', logUuid)
    .where((eb) => eb.or([eb('from_uuid', '=', uuid), eb('to_uuid', '=', uuid)]))
    .orderBy('log_uuid', 'desc')
    .limit(100)
    .execute();
  return NextResponse.json(log);
}
