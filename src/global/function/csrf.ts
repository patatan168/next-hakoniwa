export const CSRF_COOKIE_NAME = '__Host-csrf-token';

/**
 * CSRFトークンの生成
 * @returns CSRFトークン
 */
export const generateCsrfToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  // NOTE: 44文字はOWASP推奨の128-bit以上を満たす
  const length = 44;
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let token = '';
  for (let i = 0; i < length; i++) {
    // NOTE: 厳密には偏りがあるが、CSRFトークンとしては許容範囲内で高速化を優先
    token += chars[array[i] % chars.length];
  }
  return token;
};

/**
 * CSRFトークンの検証
 * @param cookieToken Cookie内のトークン
 * @param headerToken ヘッダー内のトークン
 * @returns 検証結果
 */
export const verifyCsrfToken = (cookieToken: string | undefined, headerToken: string | null) => {
  if (!cookieToken || !headerToken) return false;

  // 簡易的なバリデーション (44文字の英数字)
  // NOTE: 他機能でCSRF対策を十分に行っているため、簡易チェックのみ
  const isValidFormat = /^[a-zA-Z0-9]{44}$/.test(headerToken);
  if (!isValidFormat) return false;

  return cookieToken === headerToken;
};
