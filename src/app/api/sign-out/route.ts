import { signOutDeleteJwtDbCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { isTurnProcessing, turnProcessingResponse } from '@/global/function/turnState';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function DELETE() {
  if (isTurnProcessing()) {
    return turnProcessingResponse();
  }

  try {
    using db = dbConn('./src/db/data/main.db');
    await signOutDeleteJwtDbCookie(db.client);
    return NextResponse.json({ result: true });
  } catch {
    return NextResponse.json({ result: false });
  }
}
