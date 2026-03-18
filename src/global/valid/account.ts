/**
 * @module account
 * @description アカウント情報のZodバリデーションスキーマ定義。
 */
import * as z from 'zod';
import { fetcher } from '../function/fetch/fetch';
import { reactDebounce } from '../function/reactDebounce';
import { baseUserInfoSchema } from './userInfo';

const currentCredentialSchema = z.object({
  currentId: baseUserInfoSchema.shape.id,
  currentPassword: baseUserInfoSchema.shape.password,
});

/** フォームフィールドのバリデーション結果をコンテキストに追加 */
function addParseErrors(
  ctx: z.RefinementCtx,
  result: z.ZodSafeParseError<unknown>,
  path: string
): void {
  for (const issue of result.error.issues) ctx.addIssue({ ...issue, path: [path] });
}

/** スキーマでフィールドを検証し、エラーをコンテキストに追加 */
function validateField(
  ctx: z.RefinementCtx,
  schema: z.ZodTypeAny,
  value: string,
  path: string
): void {
  const result = schema.safeParse(value);
  if (!result.success) addParseErrors(ctx, result as z.ZodSafeParseError<unknown>, path);
}

/** アカウント情報変更バリデーション（各フィールドの重複チェック付き） */
export const changeAccountSchema = z.intersection(
  z
    .object({
      currentId: baseUserInfoSchema.shape.id,
      currentPassword: baseUserInfoSchema.shape.password,
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
      if (data.changeId) validateField(ctx, baseUserInfoSchema.shape.id, data.newId, 'newId');
      if (data.changeUserName)
        validateField(ctx, baseUserInfoSchema.shape.userName, data.newUserName, 'newUserName');
      if (data.changePassword) {
        validateField(ctx, baseUserInfoSchema.shape.password, data.newPassword, 'newPassword');
        if (data.newPassword !== data.newPasswordConfirm) {
          ctx.addIssue({
            code: 'custom',
            message: 'パスワードが一致していません。',
            path: ['newPasswordConfirm'],
          });
        }
      }
    }),
  z.object({
    newId: z.string().refine(
      reactDebounce(async (signal: AbortSignal, inputData: string) => {
        if (!inputData) return true;
        const data = await fetcher(`/api/public/user/exists?key=id&query=${inputData}`, {
          method: 'GET',
          signal,
        });
        return !data.result;
      }, 150),
      { error: 'そのIDは使用できません。' }
    ),
    newUserName: z.string().refine(
      reactDebounce(async (signal: AbortSignal, inputData: string) => {
        if (!inputData) return true;
        const data = await fetcher(`/api/public/user/exists?key=user_name&query=${inputData}`, {
          method: 'GET',
          signal,
        });
        return !data.result;
      }, 150),
      { error: 'そのユーザー名は使用できません。' }
    ),
  })
);

/** アカウント削除バリデーション */
export const deleteAccountSchema = currentCredentialSchema;

export type changeAccountForm = z.input<typeof changeAccountSchema>;
export type deleteAccountForm = z.input<typeof deleteAccountSchema>;
