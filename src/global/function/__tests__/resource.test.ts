import { describe, expect, test, vi } from 'vitest';
import { getResource } from '../resource';

vi.mock('@/global/define/metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/global/define/metadata')>();
  return {
    default: {
      ...actual.default,
      MAX_MONEY: 1000,
      MAX_FOOD: 5000,
      FOOD_TO_MONEY_RATE: 0.5,
    },
  };
});

describe('getResource', () => {
  test('受け取り量が0でも turn.ts と同等の補正を適用する', () => {
    const result = getResource({ money: 950, food: 5400 });

    expect(result).toEqual({ money: 1000, food: 5000 });
  });

  test('受け取り量が0でも資金の下限補正を適用する', () => {
    const result = getResource({ money: -10, food: 4900 });

    expect(result).toEqual({ money: 0, food: 4900 });
  });

  test('上限未満なら全量を受け取る', () => {
    const result = getResource({ money: 100, food: 2000 }, { money: 300, food: 500 });

    expect(result).toEqual({ money: 400, food: 2500 });
  });

  test('食料上限超過分は資金化される', () => {
    const result = getResource({ money: 600, food: 4900 }, { money: 100, food: 200 });

    expect(result).toEqual({ money: 750, food: 5000 });
  });

  test('資金上限に達した場合は超過分を丸める', () => {
    const result = getResource({ money: 950, food: 4900 }, { money: 100, food: 200 });

    expect(result).toEqual({ money: 1000, food: 5000 });
  });

  test('負数や非数の受け取り値は0扱いで、既存超過は補正のみ行う', () => {
    const result = getResource({ money: 1200, food: 7000 }, { money: Number.NaN, food: -20 });

    expect(result).toEqual({ money: 1000, food: 5000 });
  });
});
