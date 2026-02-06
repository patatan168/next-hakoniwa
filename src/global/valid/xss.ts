import * as z from 'zod';

/**
 * エスケープ文字列
 */
const escapeTable: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  // NOTE: 以下は名前付きが無いので数値参照
  "'": '&#39;',
  '/': '&#x2F;',
  '^': '&#94;',
  '`': '&#96;',
  '=': '&#61;',
  '{': '&#123;',
  '}': '&#125;',
  '(': '&#40;',
  ')': '&#41;',
  ':': '&#58;',
  '%': '&#37;',
  '\\': '&#92;',
};

const needEscape = new Set(Object.keys(escapeTable));

/**
 * XSS対策
 * @param input 対象の文字列
 * @returns サニタイズ済み文字列
 */
export const xss = (input: string): string => {
  const out: string[] = [];
  const len = input.length;

  for (let i = 0; i < len; i++) {
    const ch = input[i];
    if (needEscape.has(ch)) {
      out.push(escapeTable[ch]);
    } else {
      out.push(ch);
    }
  }

  return out.join('');
};

export function sanitizeJsonStringify(data: object): string {
  const sanitize = (value: object): object => {
    if (Array.isArray(value)) {
      return value.map((v) => sanitize(v));
    }
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitize(v)]));
    }
    return value;
  };
  const tmp = sanitize(data);
  return JSON.stringify(tmp);
}

export function sanitizeWithSchema<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const parsed = schema.parse(data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      return xss(value);
    }
    if (Array.isArray(value)) {
      return value.map((v) => sanitize(v));
    }
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitize(v)]));
    }
    return value;
  };

  return sanitize(parsed) as z.infer<T>;
}
