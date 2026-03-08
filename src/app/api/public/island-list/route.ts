import { db } from '@/db/kysely';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  const user = await db
    .selectFrom('user')
    .select(['uuid', 'user_name', 'island_name'])
    .where('inhabited', '=', 1)
    .execute();
  return NextResponse.json(user);
}
