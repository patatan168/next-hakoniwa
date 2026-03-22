/**
 * @module admin
 * @description 管理者認証関連のクライアント向けバリデーション。
 */
import * as z from 'zod';
import META_DATA from '../define/metadata';
import { baseUserInfoSchema } from './userInfo';

const adminMoneyMax = Number.isFinite(META_DATA.MAX_MONEY)
  ? META_DATA.MAX_MONEY
  : Number.MAX_SAFE_INTEGER;
const adminFoodMax = Number.isFinite(META_DATA.MAX_FOOD)
  ? META_DATA.MAX_FOOD
  : Number.MAX_SAFE_INTEGER;

export const adminSignInSchema = baseUserInfoSchema.pick({
  id: true,
  password: true,
});

export const adminCredentialChangeSchema = z
  .object({
    currentId: baseUserInfoSchema.shape.id,
    currentPassword: baseUserInfoSchema.shape.password,
    newId: baseUserInfoSchema.shape.id,
    newPassword: baseUserInfoSchema.shape.password,
    newPasswordConfirm: z.string().min(1, { error: 'もう一度パスワードを入力してください' }),
    newUserName: baseUserInfoSchema.shape.userName,
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.newPasswordConfirm) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPasswordConfirm'],
        message: 'パスワードが一致していません。',
      });
    }
    if (data.currentId === data.newId) {
      ctx.addIssue({
        code: 'custom',
        path: ['newId'],
        message: '初期IDと異なるIDを入力してください。',
      });
    }
    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: '初期パスワードと異なるパスワードを入力してください。',
      });
    }
  });

export const adminModeratorCreateSchema = z
  .object({
    id: baseUserInfoSchema.shape.id,
    password: baseUserInfoSchema.shape.password,
    passwordConfirm: z.string().min(1, { error: 'もう一度パスワードを入力してください' }),
    userName: baseUserInfoSchema.shape.userName,
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        path: ['passwordConfirm'],
        message: 'パスワードが一致していません。',
      });
    }
  });

export const adminUserLockSchema = z.object({
  locked: z.boolean(),
});

export const adminUserIslandUpdateSchema = z.object({
  islandName: baseUserInfoSchema.shape.islandName,
  money: z.coerce
    .number()
    .int({ error: '資金は整数で入力してください。' })
    .min(0, { error: '資金は0以上で入力してください。' })
    .max(adminMoneyMax, { error: `資金は${adminMoneyMax}以下で入力してください。` }),
  food: z.coerce
    .number()
    .int({ error: '食料は整数で入力してください。' })
    .min(0, { error: '食料は0以上で入力してください。' })
    .max(adminFoodMax, { error: `食料は${adminFoodMax}以下で入力してください。` }),
});

export const adminUserDeleteSchema = z.object({
  confirmIslandName: z.coerce
    .string()
    .trim()
    .min(1, { error: '確認用の島名を入力してください。' })
    .max(16, { error: '16文字以内で入力してください。' }),
});

export type adminSignInForm = z.input<typeof adminSignInSchema>;
export type adminCredentialChangeForm = z.input<typeof adminCredentialChangeSchema>;
export type adminModeratorCreateForm = z.input<typeof adminModeratorCreateSchema>;
export type adminUserLockForm = z.input<typeof adminUserLockSchema>;
export type adminUserIslandUpdateForm = z.input<typeof adminUserIslandUpdateSchema>;
export type adminUserDeleteForm = z.input<typeof adminUserDeleteSchema>;
