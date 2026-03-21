/**
 * @module server/admin
 * @description 管理者認証関連のサーバー向けバリデーション。
 */
import 'server-only';

import * as z from 'zod';
import { baseUserInfoSchema } from '../userInfo';

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
