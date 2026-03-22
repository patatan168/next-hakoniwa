/**
 * @module admin-api/moderators
 * @description moderator を新規登録するAPI（認可はproxyで実施）。
 */
import { db } from '@/db/kysely';
import { hasFullModeratorPermission, MODERATOR_ROLE } from '@/global/define/moderatorRole';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Gen } from '@/global/function/argon2';
import { sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { createUuid25 } from '@/global/function/uuid';
import { adminModeratorCreateSchema } from '@/global/valid/server/admin';
import { NextRequest, NextResponse } from 'next/server';

function resolveAdminContext(request: NextRequest) {
  const adminUuid = request.headers.get('x-verified-admin-uuid');
  if (!adminUuid) {
    return {
      error: NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 }),
    };
  }

  const adminRoleRaw = request.headers.get('x-verified-admin-role');
  if (adminRoleRaw === null) {
    return {
      error: NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 }),
    };
  }

  const adminRole = Number(adminRoleRaw);
  if (!Number.isFinite(adminRole)) {
    return {
      error: NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 }),
    };
  }

  if (!hasFullModeratorPermission(adminRole)) {
    return {
      error: NextResponse.json({ error: 'この操作は管理者権限が必要です。' }, { status: 403 }),
    };
  }

  return {
    context: {
      adminUuid,
      adminRole,
    },
  };
}

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const contextResult = resolveAdminContext(request);
  if (contextResult.error) return contextResult.error;

  const moderators = await db
    .selectFrom('moderator_auth')
    .select(['uuid', 'user_name', 'must_change_credentials', 'locked_until'])
    .where('role', '=', MODERATOR_ROLE.moderator)
    .orderBy('user_name', 'asc')
    .execute();

  accessLogger(request).info(
    `Moderator Listed by admin uuid=${contextResult.context.adminUuid} role=${contextResult.context.adminRole}`
  );

  return NextResponse.json({
    moderators: moderators.map((moderator) => ({
      uuid: moderator.uuid,
      userName: moderator.user_name,
      mustChangeCredentials: moderator.must_change_credentials === 1,
      isLocked: moderator.locked_until !== null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const contextResult = resolveAdminContext(request);
  if (contextResult.error) return contextResult.error;
  const { adminUuid, adminRole } = contextResult.context;

  const valid = await asyncRequestValid(request, adminModeratorCreateSchema);
  if (valid.data === null) return valid.response;

  const { id, password, userName } = valid.data;
  const hashId = await sha256Gen(id);

  const duplicatedId = await db
    .selectFrom('moderator_auth')
    .select('uuid')
    .where('id', '=', hashId)
    .executeTakeFirst();

  if (duplicatedId) {
    return NextResponse.json({ error: 'そのIDは使用できません。' }, { status: 409 });
  }

  const hashPassword = await argon2Gen(password);

  await db
    .insertInto('moderator_auth')
    .values({
      uuid: createUuid25(),
      id: hashId,
      password: hashPassword,
      user_name: userName,
      role: MODERATOR_ROLE.moderator,
      must_change_credentials: 1,
      login_fail_count: 0,
      locked_until: null,
    })
    .execute();

  accessLogger(request).info(`Moderator Created by admin uuid=${adminUuid} role=${adminRole}`);

  return NextResponse.json({ result: true });
}
