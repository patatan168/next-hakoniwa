/**
 * @module admin
 * @description 管理者認証関連のクライアント向けバリデーション。
 */
import * as z from 'zod';
import { baseUserInfoSchema } from './userInfo';

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

export type adminSignInForm = z.input<typeof adminSignInSchema>;
export type adminCredentialChangeForm = z.input<typeof adminCredentialChangeSchema>;
export type adminModeratorCreateForm = z.input<typeof adminModeratorCreateSchema>;
