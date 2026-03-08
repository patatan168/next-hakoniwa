import { db } from '@/db/kysely';
import { turnStateSchemaType } from '@/db/schema/turnStateTable';
import { Cron } from 'croner';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  const user = (await db
    .selectFrom('turn_state')
    .selectAll()
    .limit(1)
    .executeTakeFirst()) as turnStateSchemaType;

  try {
    const cronStr = process.env.NEXT_PUBLIC_TURN_CRON || process.env.TURN_CRON;
    if (cronStr) {
      const tz = process.env.NEXT_PUBLIC_TURN_TIMEZONE;
      const nextTime = new Cron(cronStr, tz ? { timezone: tz } : {}).nextRun();
      if (nextTime) {
        user.next_updated_at = nextTime.getTime();
      }
    }
  } catch {
    // 構文エラー等の場合は何もしない
  }

  return NextResponse.json(user);
}
