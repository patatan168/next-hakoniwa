import { describe, expect, test } from 'vitest';
import {
  hasFullModeratorPermission,
  MODERATOR_ROLE,
  resolveModeratorRoleName,
} from '../moderatorRole';

describe('moderatorRole', () => {
  test('role 0 を admin として名前解決する', () => {
    expect(resolveModeratorRoleName(MODERATOR_ROLE.admin)).toBe('admin');
  });

  test('role 1 を moderator として名前解決する', () => {
    expect(resolveModeratorRoleName(MODERATOR_ROLE.moderator)).toBe('moderator');
  });

  test('未知の role は unknown として扱う', () => {
    expect(resolveModeratorRoleName(99)).toBe('unknown(99)');
  });

  test('admin のみ全権限判定を true にする', () => {
    expect(hasFullModeratorPermission(MODERATOR_ROLE.admin)).toBe(true);
    expect(hasFullModeratorPermission(MODERATOR_ROLE.moderator)).toBe(false);
  });
});
