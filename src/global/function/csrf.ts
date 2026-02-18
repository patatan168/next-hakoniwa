import { uuidv7obj } from 'uuidv7';

export const CSRF_COOKIE_NAME = '__Host-csrf-token';

/**
 * CSRFトークンの生成
 * @note WAF対策のため、ハイフンを削除する
 * @returns CSRFトークン
 */
export const generateCsrfToken = () => {
  return uuidv7obj().toString().replace(/-/g, '');
};

/**
 * CSRFトークンの検証
 * @param cookieToken Cookie内のトークン
 * @param headerToken ヘッダー内のトークン
 * @returns 検証結果
 */
export const verifyCsrfToken = (cookieToken: string | undefined, headerToken: string | null) => {
  if (!cookieToken || !headerToken) return false;

  // 簡易的なUUIDv7バリデーション (ハイフンなし32文字の16進数)
  // NOTE: 他機能でCSRF対策を十分に行っているため、簡易チェックのみ
  const isValidFormat = /^[0-9a-f]{32}$/i.test(headerToken);
  if (!isValidFormat) return false;

  return cookieToken === headerToken;
};
