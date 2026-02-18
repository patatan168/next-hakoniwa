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
  return cookieToken === headerToken;
};
