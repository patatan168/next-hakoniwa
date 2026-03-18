/**
 * @module server/userInfo
 * @description サーバーサイドのユーザー情報バリデーションスキーマ。
 */
import 'server-only';

import { db } from '@/db/kysely';
import { sha256Gen } from '@/global/function/encrypt';
import * as z from 'zod';
import { baseSignUpUserInfoSchema } from '../userInfo';

export const userInfoSchema = z.intersection(
  baseSignUpUserInfoSchema,
  z.object({
    id: z.string().refine(
      async (inputData) => {
        const hashId = await sha256Gen(inputData);
        const exists = await db
          .selectFrom('auth')
          .select('id')
          .where('id', '=', hashId)
          .executeTakeFirst();
        return exists === undefined;
      },
      { error: 'そのIDは使用できません。' }
    ),
    userName: z.string().refine(
      async (inputData) => {
        const exists = await db
          .selectFrom('user')
          .select('user_name')
          .where('user_name', '=', inputData)
          .where('inhabited', '=', 1)
          .executeTakeFirst();
        return exists === undefined;
      },
      { error: 'そのユーザー名は使用できません。' }
    ),
    islandName: z.string().refine(
      async (inputData) => {
        const exists = await db
          .selectFrom('user')
          .select('island_name')
          .where('island_name', '=', inputData)
          .where('inhabited', '=', 1)
          .executeTakeFirst();
        return exists === undefined;
      },
      { error: '同じ島名は登録できません' }
    ),
  })
);
