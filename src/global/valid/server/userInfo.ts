import 'server-only';

import { existsDbDate } from '@/global/function/db';
import { z } from 'zod';
import { baseUserInfoSchema } from '../userInfo';

export const userInfoSchema = z.intersection(
  baseUserInfoSchema,
  z.object({
    id: z.coerce.string().refine(
      (inputData) => {
        return !existsDbDate({
          dbPath: './src/db/data/main.db',
          table: 'user',
          key: 'id',
          data: inputData,
        });
      },
      { message: 'そのIDは使用できません。' }
    ),
    islandName: z.string().refine(
      (inputData) => {
        return !existsDbDate({
          dbPath: './src/db/data/main.db',
          table: 'user',
          key: 'island_name',
          data: inputData,
        });
      },
      { message: '同じ島名は登録できません' }
    ),
  })
);
