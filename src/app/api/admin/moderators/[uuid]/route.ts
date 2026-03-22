/**
 * @module admin-api/moderators/[uuid]
 * @description moderator を削除するAPI（認可はproxyで実施）。
 */
import { db } from '@/db/kysely';
import { hasFullModeratorPermission, MODERATOR_ROLE } from '@/global/define/moderatorRole';
import { accessLogger } from '@/global/function/logger';
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  const contextResult = resolveAdminContext(request);
  if (contextResult.error) return contextResult.error;
  const { adminUuid, adminRole } = contextResult.context;

  const { uuid } = await context.params;

  const target = await db
    .selectFrom('moderator_auth')
    .select(['uuid', 'role'])
    .where('uuid', '=', uuid)
    .executeTakeFirst();

  if (!target) {
    return NextResponse.json({ error: '対象のモデレーターが見つかりません。' }, { status: 404 });
  }

  if (target.role !== MODERATOR_ROLE.moderator) {
    return NextResponse.json(
      { error: 'moderator ロール以外のアカウントは削除できません。' },
      { status: 400 }
    );
  }

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom('moderator_session').where('uuid', '=', uuid).execute();
    await trx.deleteFrom('moderator_auth').where('uuid', '=', uuid).execute();
  });

  accessLogger(request).info(
    `Moderator Deleted by admin uuid=${adminUuid} role=${adminRole} target=${uuid}`
  );

  return NextResponse.json({ result: true });
}
