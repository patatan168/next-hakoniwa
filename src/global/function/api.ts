/**
 * @module api
 * @description APIリクエストのバリデーションとエラーハンドリングユーティリティ。
 */
import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import * as z from 'zod';
import { sanitizeWithSchema } from '../valid/xss';
import { accessLogger } from './logger';

type statusCode2xx =
  | 200 // OK
  | 201 // Created
  | 202 // Accepted
  | 203 // Non-Authoritative Information
  | 204 // No Content
  | 205 // Reset Content
  | 206 // Partial Content
  | 207 // Multi-Status
  | 208 // Already Reported
  | 226; // IM Used

/**
 * zodでリクエストのバリデーションを行う
 * @param request リクエスト
 * @param zodSchema zodスキーマ
 * @param successCode 検証成功時にレスポンスするステータスコード (2xx)
 * @returns レスポンスとデータ
 */
export const asyncRequestValid = async <T extends z.ZodTypeAny>(
  request: NextRequest,
  zodSchema: T,
  successCode: statusCode2xx = 200
): Promise<{ response: NextResponse; data: z.infer<T> | null }> => {
  try {
    const requestBody = await request.json();
    const data = await sanitizeWithSchema<T>(zodSchema, requestBody);
    const response = NextResponse.json({ message: 'OK' }, { status: successCode });
    return { response, data };
  } catch (e) {
    if (e instanceof z.ZodError) {
      const response = NextResponse.json(
        { error: 'Invalid Input' },
        {
          status: 400,
        }
      );
      return { response, data: null };
    } else {
      accessLogger(request).error(`Unknown Error: ${e}`);
      const response = NextResponse.json(
        { error: 'Internal Error' },
        {
          status: 500,
        }
      );
      return { response, data: null };
    }
  }
};
