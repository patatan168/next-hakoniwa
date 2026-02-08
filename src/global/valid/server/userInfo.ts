import 'server-only';

import { existsDbDate } from '@/global/function/db';
import * as z from 'zod';
import { baseSignUpUserInfoSchema } from '../userInfo';

export const userInfoSchema = z.intersection(
  baseSignUpUserInfoSchema,
  z.object({
    id: z.string().refine(
      (inputData) => {
        return !existsDbDate({
          dbPath: './src/db/data/main.db',
          table: 'auth',
          key: 'id',
          data: inputData,
        });
      },
      { error: 'そのIDは使用できません。' }
    ),
    userName: z.string().refine(
      (inputData) => {
        return !existsDbDate({
          dbPath: './src/db/data/main.db',
          table: 'user',
          key: 'user_name',
          data: inputData,
          condition: 'AND inhabited = 1',
        });
      },
      { error: 'そのユーザー名は使用できません。' }
    ),
    islandName: z.string().refine(
      (inputData) => {
        return !existsDbDate({
          dbPath: './src/db/data/main.db',
          table: 'user',
          key: 'island_name',
          data: inputData,
          condition: 'AND inhabited = 1',
        });
      },
      { error: '同じ島名は登録できません' }
    ),
  })
);
