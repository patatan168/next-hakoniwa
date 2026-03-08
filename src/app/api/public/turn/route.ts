import { db, TurnState } from '@/db/kysely';
import { Cron } from 'croner';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  const turnState = await db.selectFrom('turn_state').selectAll().limit(1).executeTakeFirst();

  if (!turnState) {
    return NextResponse.json({}, { status: 404 });
  }

  const response: TurnState & { next_updated_at?: number } = { ...turnState };

  try {
    const cronStr = process.env.NEXT_PUBLIC_TURN_CRON || process.env.TURN_CRON;
    if (cronStr) {
      const tz = process.env.NEXT_PUBLIC_TURN_TIMEZONE;
      const nextTime = new Cron(cronStr, tz ? { timezone: tz } : {}).nextRun();
      if (nextTime) {
        response.next_updated_at = nextTime.getTime();
      }
    }
  } catch {
    // 構文エラー等の場合は何もしない
  }

  return NextResponse.json(response);
}
