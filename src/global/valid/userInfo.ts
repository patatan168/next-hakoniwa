import AwesomeDebouncePromise from 'awesome-debounce-promise';
import { z } from 'zod';
import { fetcher } from '../function/fetch/fetch';

export const baseUserInfoSchema = z.object({
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
      message: '8文字以上のパスワードを英大文字、英小文字、数字を含めて入力してください',
    })
    .max(24, {
      message: '24文字以下のパスワードを英大文字、英小文字、数字を含めて入力してください',
    })
    .regex(/(?=.*?[a-zA-Z])(?=.*?\d)[!-~]+/, {
      message: '英大文字、英小文字、数字を含めて入力してください',
    }),
  passwordConfirm: z.string().min(1, { message: 'もう一度パスワードを入力してください' }),
  islandName: z
    .string()
    .trim()
    .min(1, { message: '島名を入力してください' })
    .max(16, { message: '16文字以内の島名を入力してください' })
    .regex(/[^島]$/, {
      message: '末尾に「島」は登録できません',
    }),
});

export const baseSignUpUserInfoSchema = baseUserInfoSchema.refine(
  ({ password, passwordConfirm }) => password === passwordConfirm,
  {
    path: ['passwordConfirm'],
    message: 'パスワードが一致していません。',
  }
);

export const userInfoSchema = z.intersection(
  baseSignUpUserInfoSchema,
  z.object({
    id: z.coerce.string().refine(
      AwesomeDebouncePromise(async (inputData) => {
        const data = await fetcher(`/api/public/user/exists?key=id&query=${inputData}`, {
          method: 'GET',
        });
        return !data.result;
      }, 150),
      { message: 'そのIDは使用できません。' }
    ),
    islandName: z.string().refine(
      AwesomeDebouncePromise(async (inputData) => {
        const data = await fetcher(`/api/public/user/exists?key=island_name&query=${inputData}`, {
          method: 'GET',
        });
        return !data.result;
      }, 150),
      { message: '同じ島名は登録できません' }
    ),
  })
);

export const signInUserInfoSchema = baseUserInfoSchema.omit({
  passwordConfirm: true,
  islandName: true,
});

export type userInfo = z.infer<typeof baseUserInfoSchema>;
export type signInUserInfo = z.infer<typeof signInUserInfoSchema>;
