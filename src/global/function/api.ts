import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { accessLogger } from './logger';

/**
 * zodでリクエストのバリデーションを行う
 * @param request リクエスト
 * @param zodSchema zodスキーマ
 * @returns レスポンスとデータ
 */
export const asyncRequestValid = async <T extends z.ZodTypeAny>(
  request: NextRequest,
  zodSchema: T
): Promise<{ response: NextResponse; data: z.infer<T> | null }> => {
  try {
    const requestBody = await request.json();
    const data = await zodSchema.parseAsync(requestBody);
    const response = new NextResponse('Success');
    return { response, data };
  } catch (e) {
    if (e instanceof z.ZodError) {
      const errors = e.errors.map((error) => error.message).join(', ');
      accessLogger(request).error(`Valid Error: [${errors}]`);
      const response = new NextResponse('Error', {
        status: 400,
      });
      return { response, data: null };
    } else {
      accessLogger(request).error(`Unknown Error: ${e}`);
      const response = new NextResponse('Unknown Error', {
        status: 500,
      });
      return { response, data: null };
    }
  }
};

/**
 * リダイレクト先を示すレスポンス
 * @param path URLのパス
 * @returns レスポンス
 */
export const redirectPathResponse = (path: string) => {
  return NextResponse.json({ redirectUrl: path });
};
