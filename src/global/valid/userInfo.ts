import AwesomeDebouncePromise from 'awesome-debounce-promise';
import { z } from 'zod';
import { fetcher } from '../function/fetch/fetch';

export const baseUserInfoSchema = z.object({
  id: z.coerce
    .string()
    .trim()
    .min(4, { error: '4文字上のIDを入力してください' })
    .regex(/^[a-zA-Z0-9]+$/, {
      error: '英大文字、英小文字、数字で入力してください',
    })
    .regex(/^[^<>&"'/`={}():%]+$/, {
      error: '「^ < > & " \' ` = { } ( ) : %」は使用できません',
    }),
  password: z
    .string()
    .trim()
    .min(8, {
      error: '8文字以上のパスワードを英大文字、英小文字、数字を含めて入力してください',
    })
    .max(24, {
      error: '24文字以下のパスワードを英大文字、英小文字、数字を含めて入力してください',
    })
    .regex(/(?=.*?[a-zA-Z])(?=.*?\d)[!-~]+/, {
      error: '英大文字、英小文字、数字を含めて入力してください',
    })
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[\x20-\x7E]+$/, {
      error: '全角文字は使用できません',
    })
    .regex(/^[^<>&"'/`={}():%]+$/, {
      error: '「^ < > & " \' ` = { } ( ) : %」は使用できません',
    }),
  passwordConfirm: z.string().min(1, { error: 'もう一度パスワードを入力してください' }),
  userName: z.coerce
    .string()
    .trim()
    .min(1, { error: 'お名前を入力してください' })
    .max(16, { error: '16文字以内で入力してください' })
    .regex(/^[^<>&"'/`={}():%]+$/, {
      error: '「^ < > & " \' ` = { } ( ) : %」は使用できません',
    }),
  islandName: z.coerce
    .string()
    .trim()
    .min(1, { error: '島名を入力してください' })
    .max(16, { error: '16文字以内の島名を入力してください' })
    .regex(/[^島]$/, {
      error: '末尾に「島」は登録できません',
    })
    .regex(/^[^<>&"'/`={}():%]+$/, {
      error: '「^ < > & " \' ` = { } ( ) : %」は使用できません',
    }),
});

export const baseSignUpUserInfoSchema = baseUserInfoSchema.refine(
  ({ password, passwordConfirm }) => password === passwordConfirm,
  {
    path: ['passwordConfirm'],
    error: 'パスワードが一致していません。',
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
      { error: 'そのIDは使用できません。' }
    ),
    userName: z.string().refine(
      AwesomeDebouncePromise(async (inputData) => {
        const data = await fetcher(`/api/public/user/exists?key=user_name&query=${inputData}`, {
          method: 'GET',
        });
        return !data.result;
      }, 150),
      { error: 'そのユーザー名は使用できません。' }
    ),
    islandName: z.string().refine(
      AwesomeDebouncePromise(async (inputData) => {
        const data = await fetcher(`/api/public/user/exists?key=island_name&query=${inputData}`, {
          method: 'GET',
        });
        return !data.result;
      }, 150),
      { error: '同じ島名は登録できません' }
    ),
  })
);

export const signInUserInfoSchema = baseUserInfoSchema.omit({
  passwordConfirm: true,
  userName: true,
  islandName: true,
});

export type userInfo = z.input<typeof userInfoSchema>;
export type signInUserInfo = z.input<typeof signInUserInfoSchema>;
