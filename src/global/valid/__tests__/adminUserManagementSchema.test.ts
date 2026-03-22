import { describe, expect, test } from 'vitest';
import { adminUserDeleteSchema, adminUserIslandUpdateSchema, adminUserLockSchema } from '../admin';

describe('admin user management schemas', () => {
  test('ロック操作は boolean を許可する', () => {
    expect(adminUserLockSchema.safeParse({ locked: true }).success).toBe(true);
    expect(adminUserLockSchema.safeParse({ locked: false }).success).toBe(true);
    expect(adminUserLockSchema.safeParse({ locked: 'true' }).success).toBe(false);
  });

  test('島編集は islandName/money/food を検証する', () => {
    expect(
      adminUserIslandUpdateSchema.safeParse({
        islandName: 'テスト01',
        money: 100,
        food: 200,
      }).success
    ).toBe(true);

    expect(
      adminUserIslandUpdateSchema.safeParse({
        islandName: 'テスト01',
        money: -1,
        food: 200,
      }).success
    ).toBe(false);
  });

  test('削除確認は確認用島名を必須にする', () => {
    expect(adminUserDeleteSchema.safeParse({ confirmIslandName: 'サンプル島' }).success).toBe(true);
    expect(adminUserDeleteSchema.safeParse({ confirmIslandName: '' }).success).toBe(false);
  });
});
