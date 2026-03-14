import { db } from '@/db/kysely';
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

  const history = await db
    .selectFrom('turn_resource_history')
    .select(['turn', 'population', 'food', 'money'])
    .where('uuid', '=', uuid)
    .orderBy('turn', 'desc')
    .limit(100)
    .execute();

  // 取得はdesc、表示は時系列順にしたいのでレスポンス前に反転する
  return NextResponse.json(history.reverse());
}
