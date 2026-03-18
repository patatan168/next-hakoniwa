/**
 * @module developmentSettings
 * @description 開発設定のZodバリデーションスキーマ定義。
 */
import * as z from 'zod';
import { fetcher } from '../function/fetch/fetch';
import { reactDebounce } from '../function/reactDebounce';
import { baseUserInfoSchema } from './userInfo';

const islandNamePrefixSchema = z
  .string()
  .trim()
  .max(6, { error: '島名Prefixは6文字以内で入力してください' })
  .regex(/^[^<>&"'/`={}():%]*$/, {
    error: '「^ < > & " \' ` = { } ( ) : %」は使用できません',
  });

const titleSchema = z
  .string()
  .trim()
  .max(63, { error: '称号は63文字以内で入力してください' })
  .regex(/^[^<>&"'/`={}():%]*$/, {
    error: '「^ < > & " \' ` = { } ( ) : %」は使用できません',
  });

export const createDevelopmentSettingsSchema = (currentIslandName = '') =>
  z
    .object({
      islandName: z.string(),
      islandNamePrefix: islandNamePrefixSchema,
      title: titleSchema,
    })
    .superRefine(async (data, ctx) => {
      const islandNameResult = await baseUserInfoSchema.shape.islandName.safeParseAsync(
        data.islandName
      );
      if (!islandNameResult.success) {
        for (const issue of islandNameResult.error.issues) {
          ctx.addIssue({ ...issue, path: ['islandName'] });
        }
        return;
      }

      const duplicateCheck = reactDebounce(async (signal: AbortSignal, inputData: string) => {
        const trimmed = inputData.trim();
        if (trimmed === '' || trimmed === currentIslandName) return true;
        const response = await fetcher(`/api/public/user/exists?key=island_name&query=${trimmed}`, {
          method: 'GET',
          signal,
        });
        return !response.result;
      }, 150);

      const isAvailable = await duplicateCheck(data.islandName);
      if (!isAvailable) {
        ctx.addIssue({
          code: 'custom',
          message: '同じ島名は登録できません',
          path: ['islandName'],
        });
      }
    });
