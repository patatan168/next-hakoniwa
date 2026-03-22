/**
 * @module admin-api/users/[uuid]/lock
 * @description ユーザーロック/解除API。
 */
import { db } from '@/db/kysely';
import META_DATA from '@/global/define/metadata';
import { accessLogger } from '@/global/function/logger';
import { adminUserLockSchema } from '@/global/valid/server/admin';
import { NextRequest, NextResponse } from 'next/server';
import { resolveAdminContext } from '../../_shared';

const PERMANENT_LOCK_UNTIL = '9999-12-31 23:59:59';

export async function OPTIONS() {
  return NextResponse.json({});
}

async function parseLockInput(
  request: NextRequest
): Promise<{ locked?: boolean; error?: NextResponse }> {
  const contentType = request.headers.get('content-type') ?? '';
  let payload: unknown;

  if (contentType.includes('application/json')) {
    try {
      payload = await request.json();
    } catch {
      return {
        error: NextResponse.json({ error: 'JSON形式が不正です。' }, { status: 400 }),
      };
    }
  } else {
    const lockedParam = request.nextUrl.searchParams.get('locked');
    if (lockedParam === null) {
      return {
        error: NextResponse.json(
          { error: 'リクエストボディに locked(bool) が必要です。' },
          { status: 400 }
        ),
      };
    }
    payload = { locked: lockedParam === 'true' };
  }

  const parsed = adminUserLockSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      error: NextResponse.json({ error: 'Invalid Input' }, { status: 400 }),
    };
  }

  return { locked: parsed.data.locked };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  try {
    const contextResult = resolveAdminContext(request);
    if (contextResult.error) return contextResult.error;
    const { adminUuid, adminRole } = contextResult.context!;

    const { uuid } = await context.params;

    const target = await db
      .selectFrom('auth')
      .select(['uuid'])
      .where('uuid', '=', uuid)
      .executeTakeFirst();

    if (!target) {
      return NextResponse.json({ error: '対象ユーザーが見つかりません。' }, { status: 404 });
    }

    const parsedInput = await parseLockInput(request);
    if (parsedInput.error) return parsedInput.error;
    const shouldLock = parsedInput.locked!;

    const nextLockedUntil = shouldLock ? PERMANENT_LOCK_UNTIL : null;
    const nextFailCount = shouldLock ? META_DATA.LOGIN_FAIL_LIMIT : 0;

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('auth')
        .set({
          locked_until: nextLockedUntil,
          login_fail_count: nextFailCount,
        })
        .where('uuid', '=', uuid)
        .execute();

      if (shouldLock) {
        await trx.deleteFrom('access_token').where('uuid', '=', uuid).execute();
        await trx.deleteFrom('refresh_token').where('uuid', '=', uuid).execute();
      }
    });

    accessLogger(request).info(
      `Admin User Lock Updated by uuid=${adminUuid} role=${adminRole} target=${uuid} locked=${shouldLock}`
    );

    return NextResponse.json({ result: true });
  } catch (error) {
    accessLogger(request).error(`Admin User Lock Update Failed: ${error}`);
    return NextResponse.json({ error: 'ロック状態の更新に失敗しました。' }, { status: 500 });
  }
}
