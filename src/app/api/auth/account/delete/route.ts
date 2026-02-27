import { authSchemaType } from '@/db/schema/authTable';
import { islandSchemaType } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { logIslandDelete } from '@/global/define/logType';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Verify } from '@/global/function/argon2';
import { signOutDeleteJwtDbCookie, validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { createUuid25, sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { abandonIsland } from '@/global/function/turnProgress';
import { isTurnProcessing, turnProcessingResponse } from '@/global/function/turnState';
import { deleteAccountSchema } from '@/global/valid/server/account';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/** アカウント削除（島の放棄） */
export async function DELETE(request: NextRequest) {
  if (isTurnProcessing()) {
    return turnProcessingResponse();
  }

  using db = dbConn('./src/db/data/main.db');
  const uuid = await validAuthCookie(db.client, true);
  if (!uuid) {
    return NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 });
  }

  const valid = await asyncRequestValid(request, deleteAccountSchema);
  if (valid.data === null) return valid.response;

  const { currentId, currentPassword } = valid.data;

  // 現在のID・パスワード検証
  const hashCurrentId = await sha256Gen(currentId);
  const auth = db.client
    .prepare<
      [string, string],
      Pick<authSchemaType, 'password'>
    >('SELECT password FROM auth WHERE uuid = ? AND id = ?')
    .get(uuid, hashCurrentId);
  if (!auth) {
    return NextResponse.json({ error: 'IDまたはパスワードが正しくありません。' }, { status: 401 });
  }

  const verified = await argon2Verify(auth.password, currentPassword);
  if (!verified) {
    return NextResponse.json({ error: 'IDまたはパスワードが正しくありません。' }, { status: 401 });
  }

  // 島の放棄処理（共通関数）
  db.client.transaction(() => {
    // 削除前に島情報を取得（ログ用）
    const island = db.client
      .prepare<
        string,
        islandSchemaType & Pick<userSchemaType, 'island_name'>
      >('SELECT user.island_name, island.* FROM user INNER JOIN island ON user.uuid = island.uuid WHERE user.uuid = ?')
      .get(uuid);

    // 島の放棄
    abandonIsland(db.client, uuid);

    // 放棄ログの挿入
    if (island) {
      const turn = db.client.prepare<[], { turn: number }>('SELECT turn FROM turn_state').get();
      db.client
        .prepare(
          'INSERT INTO turn_log (log_uuid, from_uuid, to_uuid, turn, secret_log, log) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .run(createUuid25(), uuid, null, turn?.turn ?? 0, '', logIslandDelete(island));
    }
  })();

  // サインアウト処理（Cookie/DB削除）
  await signOutDeleteJwtDbCookie(db.client);

  accessLogger(request).info(`Delete Account uuid=${uuid}`);
  return NextResponse.json({ result: true });
}
