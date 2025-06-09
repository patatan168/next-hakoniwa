import { z } from 'zod';
import META_DATA from '../define/metadata';

export const planInfoZodValid = z.object({
  fromUuid: z.string().uuid({ message: '不正なUUIDです' }),
  toUuid: z.string().uuid({ message: '不正なUUIDです' }),
  planNo: z.coerce.number(),
  times: z.coerce
    .number()
    .int({ message: '小数回は不正です' })
    .min(0, { message: '不正な回数です' })
    .max(99, { message: '不正な回数です' }),
  x: z.coerce
    .number()
    .int({ message: '小数X座標は不正です' })
    .min(0, { message: 'マイナスのX座標は不正です' })
    .max(META_DATA.MAP_SIZE - 1, {
      message: `X座標${META_DATA.MAP_SIZE}以上は不正です`,
    }),
  y: z.coerce
    .number()
    .int({ message: '小数Y座標は不正です' })
    .min(0, { message: 'マイナスのY座標は不正です' })
    .max(META_DATA.MAP_SIZE - 1, {
      message: `Y座標${META_DATA.MAP_SIZE}以上は不正です`,
    }),
  plan: z.string().trim(),
});

export type planInfoZod = z.infer<typeof planInfoZodValid>;
