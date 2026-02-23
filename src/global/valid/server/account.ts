import 'server-only';

import { existsDbDate } from '@/global/function/db';
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
function validateAndCheckDb(
  ctx: z.RefinementCtx,
  schema: z.ZodTypeAny,
  value: string,
  path: string,
  table: string,
  key: string,
  duplicateError: string
): void {
  const result = schema.safeParse(value);
  if (!result.success) {
    addParseErrors(ctx, result as z.ZodSafeParseError<unknown>, path);
    return;
  }
  if (existsDbDate({ dbPath: './src/db/data/main.db', table, key, data: value })) {
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
  .superRefine((data, ctx) => {
    if (!data.changeId && !data.changeUserName && !data.changePassword) {
      ctx.addIssue({
        code: 'custom',
        message: '1つ以上選択してください',
        path: ['changeId'],
      });
      return;
    }
    if (data.changeId) {
      validateAndCheckDb(
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
      validateAndCheckDb(
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
      const pwResult = baseUserInfoSchema.shape.password.safeParse(data.newPassword);
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
