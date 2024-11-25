import { z } from 'zod';

export const userInfoSchema = z
  .object({
    id: z.coerce
      .string()
      .trim()
      .min(4, { message: '4文字上のIDを入力してください' })
      .regex(/^[a-zA-Z0-9]+$/, {
        message: '英大文字、英小文字、数字で入力してください',
      }),
    password: z
      .string()
      .trim()
      .min(8, {
        message: '8文字~24文字のパスワードを英大文字、英小文字、数字を含めて入力してください',
      })
      .max(24, {
        message: '24桁以下のパスワードを英大文字、英小文字、数字を含めて入力してください',
      })
      .regex(/(?=.*?[a-zA-Z])(?=.*?\d)[!-~]+/, {
        message: '英大文字、英小文字、数字を含めて入力してください',
      }),
    passwordConfirm: z.string().min(1, { message: 'もう一度パスワードを入力してください。' }),
    islandName: z
      .string()
      .trim()
      .min(1, { message: '島名を入力してください' })
      .max(16, { message: '16文字以内の島名を入力してください' })
      .regex(/[^島]$/, {
        message: '末尾に「島」は登録できません',
      }),
  })
  .refine(({ password, passwordConfirm }) => password === passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'パスワードが一致していません。',
  });

export type userInfo = z.infer<typeof userInfoSchema>;
