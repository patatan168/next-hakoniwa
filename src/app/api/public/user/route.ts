import { sha256 } from '@/global/function/auth';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  const user = await getAlluser();
  return NextResponse.json(user);
}

export async function POST(request: NextRequest) {
  const { id, password, islandName } = await request.json();
  const uuid = crypto.randomUUID();
  const hashId = await sha256(id);
  const hashPass = await sha256(password);

  await prisma.user.create({
    data: {
      uuid: uuid,
      id: hashId,
      password: hashPass,
      islandName: islandName,
    },
  });

  const user = await getAlluser();
  return NextResponse.json(user);
}

export async function DELETE(request: NextRequest) {
  const { id, password } = await request.json();
  const hashId = await sha256(id);
  const hashPass = await sha256(password);

  await prisma.user.deleteMany({
    where: {
      id: { equals: hashId },
      password: { equals: hashPass },
    },
  });

  const user = await getAlluser();
  return NextResponse.json(user);
}

/**
 * ユーザー情報取得
 * @returns 全ユーザー情報
 */
async function getAlluser() {
  const user = await prisma.user.findMany();
  return user;
}
