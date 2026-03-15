import { db } from '@/db/kysely';
import { asyncRequestValid } from '@/global/function/api';
import { validAuthCookie } from '@/global/function/auth';
import {
  getIslandNameChangeCooldownDays,
  getIslandNameChangeCooldownSeconds,
} from '@/global/function/islandNameChangeCooldown';
import { accessLogger } from '@/global/function/logger';
import { isTurnProcessing, turnProcessingResponse } from '@/global/function/turnState';
import { developmentSettingsSchema } from '@/global/valid/server/developmentSettings';
import { NextRequest, NextResponse } from 'next/server';

const nowUnix = () => Math.floor(Date.now() / 1000);

const errorResponse = (error: string, status: number) => NextResponse.json({ error }, { status });

async function getCurrentUser(uuid: string) {
  return db
    .selectFrom('user')
    .select(['uuid', 'island_name_changed_at'])
    .where('uuid', '=', uuid)
    .executeTakeFirst();
}

async function validateIslandNameChange(
  uuid: string,
  currentUser: { island_name_changed_at: number },
  nextIslandName?: string
) {
  if (nextIslandName === undefined) return null;

  const cooldownSeconds = getIslandNameChangeCooldownSeconds();
  const cooldownDays = getIslandNameChangeCooldownDays();

  const exists = await db
    .selectFrom('user')
    .select('uuid')
    .where('island_name', '=', nextIslandName)
    .where('uuid', '!=', uuid)
    .executeTakeFirst();
  if (exists) {
    return errorResponse('同じ島名は登録できません。', 409);
  }

  const now = nowUnix();
  if (
    currentUser.island_name_changed_at > 0 &&
    now < currentUser.island_name_changed_at + cooldownSeconds
  ) {
    return errorResponse(`島の名前は${cooldownDays}日間変更できません。`, 429);
  }

  return null;
}

async function validateTitleSelection(uuid: string, nextTitle?: string) {
  if (nextTitle === undefined || nextTitle === '') return null;

  const hasPrize = await db
    .selectFrom('prize')
    .select('prize')
    .where('uuid', '=', uuid)
    .where('prize', '=', nextTitle)
    .executeTakeFirst();
  if (!hasPrize) {
    return errorResponse('その称号は選択できません。', 400);
  }

  return null;
}

async function updateDevelopmentSettings(
  uuid: string,
  nextIslandName: string | undefined,
  nextIslandNamePrefix: string | undefined,
  nextTitle: string | undefined
) {
  await db.transaction().execute(async (trx) => {
    if (nextIslandName !== undefined) {
      await trx
        .updateTable('user')
        .set({ island_name: nextIslandName, island_name_changed_at: nowUnix() })
        .where('uuid', '=', uuid)
        .execute();
    }

    if (nextIslandNamePrefix !== undefined) {
      await trx
        .updateTable('user')
        .set({ island_name_prefix: nextIslandNamePrefix })
        .where('uuid', '=', uuid)
        .execute();
    }

    if (nextTitle !== undefined) {
      await trx.updateTable('island').set({ prize: nextTitle }).where('uuid', '=', uuid).execute();
    }
  });
}

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function PUT(request: NextRequest) {
  if (await isTurnProcessing()) {
    return turnProcessingResponse();
  }

  const uuid = await validAuthCookie(db, true);
  if (!uuid) {
    return errorResponse('認証に失敗しました。', 401);
  }

  const valid = await asyncRequestValid(request, developmentSettingsSchema);
  if (valid.data === null) return valid.response;

  const nextIslandName = valid.data.islandName?.trim();
  const nextIslandNamePrefix = valid.data.islandNamePrefix?.trim() ?? undefined;
  const nextTitle = valid.data.title?.trim();

  const currentUser = await getCurrentUser(uuid);
  if (!currentUser) {
    return errorResponse('ユーザー情報が見つかりません。', 404);
  }

  const islandNameError = await validateIslandNameChange(uuid, currentUser, nextIslandName);
  if (islandNameError) return islandNameError;

  const titleError = await validateTitleSelection(uuid, nextTitle);
  if (titleError) return titleError;

  await updateDevelopmentSettings(uuid, nextIslandName, nextIslandNamePrefix, nextTitle);

  accessLogger(request).info(`Update Development Settings uuid=${uuid}`);
  return NextResponse.json({ result: true });
}
