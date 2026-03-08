import { db } from '@/db/kysely';
import { sha256Gen } from '@/global/function/encrypt';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key') ?? '';
  const query = searchParams.get('query') ?? '';
  if (query.length > 0) {
    switch (key) {
      case 'id': {
        const hashId = await sha256Gen(query);
        const result = await db
          .selectFrom('auth')
          .select('id')
          .where('id', '=', hashId)
          .executeTakeFirst();
        return NextResponse.json({ result: result !== undefined });
      }
      case 'user_name': {
        const result = await db
          .selectFrom('user')
          .select('user_name')
          .where('user_name', '=', query)
          .where('inhabited', '=', 1)
          .executeTakeFirst();
        return NextResponse.json({ result: result !== undefined });
      }
      case 'island_name': {
        const result = await db
          .selectFrom('user')
          .select('island_name')
          .where('island_name', '=', query)
          .where('inhabited', '=', 1)
          .executeTakeFirst();
        return NextResponse.json({ result: result !== undefined });
      }
    }
  }
  // NOTE: セキュリティのため、idとisland_name以外はすべてtrueを返す
  return NextResponse.json({ result: true });
}
