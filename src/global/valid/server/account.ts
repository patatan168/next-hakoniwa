/**
 * @module server/account
 * @description サーバーサイドのアカウントバリデーションスキーマ。
 */
import 'server-only';

import { db } from '@/db/kysely';
import * as z from 'zod';
import { baseUserInfoSchema } from '../userInfo';

const currentCredentialSchema = z.object({
  currentId: baseUserInfoSchema.shape.id,
  currentPassword: z.string().trim().min(1, { error: '現在のパスワードを入力してください' }),
});

/** フォームフィールドのバリデーション結果をコンテキストに追加 */
function addParseErrors(
  ctx: z.RefinementCtx,
  result: z.ZodSafeParseError<unknown>,
  path: string
): void {
  for (const issue of result.error.issues) ctx.addIssue({ ...issue, path: [path] });
}

/** スキーマとDB重複チェックでフィールドを検証 */
async function validateAndCheckDb(
  ctx: z.RefinementCtx,
  schema: z.ZodTypeAny,
  value: string,
  path: string,
  table: 'user' | 'auth',
  key: 'id' | 'user_name',
  duplicateError: string
): Promise<void> {
  const result = await schema.safeParseAsync(value);
  if (!result.success) {
    addParseErrors(ctx, result as z.ZodSafeParseError<unknown>, path);
    return;
  }

  let exists = false;
  if (table === 'user' && key === 'user_name') {
    const res = await db
      .selectFrom('user')
      .select('user_name')
      .where('user_name', '=', value)
      .executeTakeFirst();
    exists = res !== undefined;
  } else if (table === 'auth' && key === 'id') {
    const res = await db.selectFrom('auth').select('id').where('id', '=', value).executeTakeFirst();
    exists = res !== undefined;
  }

  if (exists) {
    ctx.addIssue({ code: 'custom', message: duplicateError, path: [path] });
  }
}

/** アカウント情報変更バリデーション */
export const changeAccountSchema = z
  .object({
    currentId: baseUserInfoSchema.shape.id,
    currentPassword: z.string().trim().min(1, { error: '現在のパスワードを入力してください' }),
    changeId: z.boolean(),
    newId: z.string(),
    changeUserName: z.boolean(),
    newUserName: z.string(),
    changePassword: z.boolean(),
    newPassword: z.string(),
    newPasswordConfirm: z.string(),
  })
  .superRefine(async (data, ctx) => {
    if (!data.changeId && !data.changeUserName && !data.changePassword) {
      ctx.addIssue({
        code: 'custom',
        message: '1つ以上選択してください',
        path: ['changeId'],
      });
      return;
    }
    if (data.changeId) {
      await validateAndCheckDb(
        ctx,
        baseUserInfoSchema.shape.id,
        data.newId,
        'newId',
        'auth',
        'id',
        'そのIDは使用できません。'
      );
    }
    if (data.changeUserName) {
      await validateAndCheckDb(
        ctx,
        baseUserInfoSchema.shape.userName,
        data.newUserName,
        'newUserName',
        'user',
        'user_name',
        'そのユーザー名は使用できません。'
      );
    }
    if (data.changePassword) {
      const pwResult = await baseUserInfoSchema.shape.password.safeParseAsync(data.newPassword);
      if (!pwResult.success)
        addParseErrors(ctx, pwResult as z.ZodSafeParseError<unknown>, 'newPassword');
      if (data.newPassword !== data.newPasswordConfirm) {
        ctx.addIssue({
          code: 'custom',
          message: 'パスワードが一致していません。',
          path: ['newPasswordConfirm'],
        });
      }
    }
  });

/** アカウント削除バリデーション */
export const deleteAccountSchema = currentCredentialSchema;
