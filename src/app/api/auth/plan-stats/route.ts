import { db } from '@/db/kysely';
import { getPlanDefine } from '@/global/define/planType';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: Request) {
  const uuid = request.headers.get('x-verified-uuid');
  if (!uuid) {
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }

  const rows = await db
    .selectFrom('plan_stats')
    .select(['plan', 'count'])
    .where('uuid', '=', uuid)
    .orderBy('count', 'desc')
    .execute();

  const result = rows.map(({ plan, count }) => ({
    plan,
    name: getPlanDefine(plan).name,
    count,
  }));

  return NextResponse.json(result);
}
