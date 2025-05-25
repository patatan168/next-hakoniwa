import 'server-only';

import { NextRequest } from 'next/server';

/**
 * リクエストからIPアドレスを取得する
 * @param request Next.jsのリクエスト
 * @returns IPアドレス
 */
export const getIpAddress = (request: NextRequest) => {
  const xForwarded = request.headers.get('x-forwarded-for');
  // FIXME: 踏み台の対応にはまだ不十分
  if (xForwarded !== null) {
    return xForwarded.split(',')[0];
  } else {
    return '0.0.0.0';
  }
};
