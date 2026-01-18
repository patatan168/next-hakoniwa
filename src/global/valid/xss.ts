import xss from 'xss';
import { z } from 'zod';

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
