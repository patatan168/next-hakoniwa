import * as z from 'zod';
import META_DATA from '../define/metadata';

export const planInfoZodValid = z.object({
  from_uuid: z.string(),
  to_uuid: z.string(),
  plan_no: z.coerce.number().int(),
  times: z.coerce
    .number()
    .int({ error: '小数回は不正です' })
    .min(0, { error: '不正な回数です' })
    .max(99, { error: '不正な回数です' }),
  x: z.coerce
    .number()
    .int({ error: '小数X座標は不正です' })
    .min(0, { error: 'マイナスのX座標は不正です' })
    .max(META_DATA.MAP_SIZE - 1, {
      error: `X座標${META_DATA.MAP_SIZE}以上は不正です`,
    }),
  y: z.coerce
    .number()
    .int({ error: '小数Y座標は不正です' })
    .min(0, { error: 'マイナスのY座標は不正です' })
    .max(META_DATA.MAP_SIZE - 1, {
      error: `Y座標${META_DATA.MAP_SIZE}以上は不正です`,
    }),
  plan: z.string().trim(),
  edit: z.boolean(),
});

export type planInfoZod = z.input<typeof planInfoZodValid>;
