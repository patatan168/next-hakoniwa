/**
 * @module server/developmentSettings
 * @description サーバーサイドの開発設定バリデーションスキーマ。
 */
import 'server-only';

import * as z from 'zod';
import { baseUserInfoSchema } from '../userInfo';

const islandNamePrefixSchema = z
  .string()
  .trim()
  .max(6, { error: '島名Prefixは6文字以内で入力してください' });

const titleSchema = z
  .string()
  .trim()
  .max(63, { error: '称号は63文字以内で入力してください' })
  .regex(/^[^<>&"'/`={}():%]*$/, {
    error: '「^ < > & " \' ` = { } ( ) : %」は使用できません',
  });

export const developmentSettingsSchema = z
  .object({
    islandName: baseUserInfoSchema.shape.islandName.optional(),
    islandNamePrefix: islandNamePrefixSchema.optional(),
    title: titleSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.islandName === undefined &&
      data.islandNamePrefix === undefined &&
      data.title === undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        message: '変更項目がありません',
        path: ['islandName'],
      });
    }
  });
