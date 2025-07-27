import { dbConn } from '@/global/function/db';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  using db = dbConn('./src/db/data/main.db');
  const user = db.client.prepare('SELECT * FROM turn_state Limit 1').get();
  return NextResponse.json(user);
}
