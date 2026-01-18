import { existsDbDate } from '@/global/function/db';
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
        const result = existsDbDate({
          dbPath: './src/db/data/main.db',
          table: 'auth',
          key: key,
          data: hashId,
        });
        return NextResponse.json({ result: result });
      }
      case 'user_name': {
        const result = existsDbDate({
          dbPath: './src/db/data/main.db',
          table: 'user',
          key: key,
          data: query,
          condition: 'AND inhabited = 1',
        });
        return NextResponse.json({ result: result });
      }
      case 'island_name': {
        const result = existsDbDate({
          dbPath: './src/db/data/main.db',
          table: 'user',
          key: key,
          data: query,
          condition: 'AND inhabited = 1',
        });
        return NextResponse.json({ result: result });
      }
    }
  }
  // NOTE: セキュリティのため、idとisland_name以外はすべてtrueを返す
  return NextResponse.json({ result: true });
}
