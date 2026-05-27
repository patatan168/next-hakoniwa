/**
 * @module passwordDenylist
 * @description よく使用される推測されやすいパスワードを判定するユーティリティ。
 */

const commonPasswordBlocklist = new Set([
  '123456789012345',
  '111111111111111',
  '000000000000000',
  'qwerty1234567890',
  'qwertyuiop12345',
  'admin1234567890',
  'adminadmin12345',
  'letmein123456789',
  'welcome123456789',
  'iloveyou1234567',
  'abc123abc123abc',
  'p@ssw0rd1234567',
]);

const commonPasswordRoots = [
  'password',
  'qwerty',
  'admin',
  'letmein',
  'welcome',
  'iloveyou',
  'abc123',
  'dragon',
  'monkey',
  'princess',
  'football',
  'baseball',
  'login',
  'master',
  'superman',
  'sunshine',
  'freedom',
  'whatever',
  'secret',
  'charlie',
];

const leetToAlphaMap: Record<string, string> = {
  '@': 'a',
  $: 's',
  '0': 'o',
  '!': 'i',
};

const normalizePasswordForBlocklist = (password: string): string => {
  const lower = password.toLowerCase();
  return Array.from(lower)
    .map((char) => leetToAlphaMap[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]/g, '');
};

export const isCommonPassword = (password: string): boolean => {
  const normalized = normalizePasswordForBlocklist(password);

  if (commonPasswordBlocklist.has(normalized)) {
    return true;
  }

  return commonPasswordRoots.some((root) => {
    const rootPattern = new RegExp(`^${root}(\\d+)?$`);
    return rootPattern.test(normalized);
  });
};
