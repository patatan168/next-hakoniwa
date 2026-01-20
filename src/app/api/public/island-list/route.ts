import { dbConn } from '@/global/function/db';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  using db = dbConn('./src/db/data/main.db');
  const user = db.client
    .prepare('SELECT uuid, user_name, island_name FROM user WHERE inhabited = 1')
    .all();
  return NextResponse.json(user);
}
