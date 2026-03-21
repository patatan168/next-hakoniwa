import { describe, expect, test } from 'vitest';
import {
  isOwnIslandSelectedInSelect,
  resolveOtherIslandFallback,
  shouldSyncSelectedIslandFromSelect,
} from '../islandViewToggle';

describe('isOwnIslandSelectedInSelect', () => {
  test('Selectが自島ならtrueを返す', () => {
    expect(isOwnIslandSelectedInSelect('own-uuid', 'own-uuid')).toBe(true);
  });

  test('Selectが他島ならfalseを返す', () => {
    expect(isOwnIslandSelectedInSelect('other-uuid', 'own-uuid')).toBe(false);
  });

  test('自島UUIDが空ならfalseを返す', () => {
    expect(isOwnIslandSelectedInSelect('own-uuid', '')).toBe(false);
  });
});

describe('shouldSyncSelectedIslandFromSelect', () => {
  test('Select値が未設定なら同期しない', () => {
    expect(
      shouldSyncSelectedIslandFromSelect({
        targetIslandUuid: '',
        previousTargetIslandUuid: 'own-uuid',
      })
    ).toBe(false);
  });

  test('前回と同じSelect値なら同期しない', () => {
    expect(
      shouldSyncSelectedIslandFromSelect({
        targetIslandUuid: 'own-uuid',
        previousTargetIslandUuid: 'own-uuid',
      })
    ).toBe(false);
  });

  test('Select値が変わったら同期する', () => {
    expect(
      shouldSyncSelectedIslandFromSelect({
        targetIslandUuid: 'other-uuid',
        previousTargetIslandUuid: 'own-uuid',
      })
    ).toBe(true);
  });
});

describe('resolveOtherIslandFallback', () => {
  test('直近の他島があればそれを返す', () => {
    expect(
      resolveOtherIslandFallback({
        lastOtherIslandUuid: 'other-2',
        firstOtherIslandUuid: 'other-1',
        ownIslandUuid: 'own-uuid',
      })
    ).toBe('other-2');
  });

  test('直近の他島がなければ最初の他島を返す', () => {
    expect(
      resolveOtherIslandFallback({
        lastOtherIslandUuid: '',
        firstOtherIslandUuid: 'other-1',
        ownIslandUuid: 'own-uuid',
      })
    ).toBe('other-1');
  });

  test('他島がなければ自島を返す', () => {
    expect(
      resolveOtherIslandFallback({
        lastOtherIslandUuid: '',
        firstOtherIslandUuid: '',
        ownIslandUuid: 'own-uuid',
      })
    ).toBe('own-uuid');
  });
});
