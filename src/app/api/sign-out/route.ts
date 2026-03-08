import { db } from '@/db/kysely';
import { signOutDeleteJwtDbCookie } from '@/global/function/auth';
import { isTurnProcessing, turnProcessingResponse } from '@/global/function/turnState';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function DELETE() {
  if (await isTurnProcessing()) {
    return turnProcessingResponse();
  }

  try {
    await signOutDeleteJwtDbCookie(db);
    return NextResponse.json({ result: true });
  } catch {
    return NextResponse.json({ result: false });
  }
}
