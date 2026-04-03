import { describe, expect, test } from 'vitest';
import { isEqual, omit, pick, sortBy, uniqBy } from '../collection';

describe('collection utilities', () => {
  test('isEqual compares nested objects deeply', () => {
    const left = {
      a: 1,
      b: ['x', { c: true }],
      d: new Date('2024-01-01T00:00:00.000Z'),
    };
    const right = {
      a: 1,
      b: ['x', { c: true }],
      d: new Date('2024-01-01T00:00:00.000Z'),
    };

    expect(isEqual(left, right)).toBe(true);
    expect(isEqual(left, { ...right, a: 2 })).toBe(false);
  });

  test('isEqual handles circular references', () => {
    const left: { name: string; self?: unknown } = { name: 'left' };
    const right: { name: string; self?: unknown } = { name: 'left' };
    left.self = left;
    right.self = right;

    expect(isEqual(left, right)).toBe(true);
  });

  test('isEqual enforces one-to-one matching for Set values', () => {
    const left = new Set([{ id: 1 }, { id: 1 }]);
    const right = new Set([{ id: 1 }, { id: 2 }]);

    expect(isEqual(left, right)).toBe(false);
  });

  test('isEqual enforces one-to-one matching for Map entries', () => {
    const left = new Map([
      [{ key: 1 }, { value: 1 }],
      [{ key: 1 }, { value: 1 }],
    ]);
    const right = new Map([
      [{ key: 1 }, { value: 1 }],
      [{ key: 2 }, { value: 1 }],
    ]);

    expect(isEqual(left, right)).toBe(false);
  });

  test('uniqBy removes duplicates by iteratee', () => {
    const list = [
      { id: 1, value: 'A' },
      { id: 1, value: 'B' },
      { id: 2, value: 'C' },
    ];

    expect(uniqBy(list, (item) => item.id)).toEqual([
      { id: 1, value: 'A' },
      { id: 2, value: 'C' },
    ]);
  });

  test('sortBy sorts by key name array', () => {
    const list = [
      { plan_no: 2, plan: 'c' },
      { plan_no: 0, plan: 'a' },
      { plan_no: 1, plan: 'b' },
    ];

    expect(sortBy(list, ['plan_no']).map((item) => item.plan_no)).toEqual([0, 1, 2]);
  });

  test('omit and pick return expected shape', () => {
    const source = { a: 1, b: 2, c: 3 };

    expect(omit(source, ['b'])).toEqual({ a: 1, c: 3 });
    expect(pick(source, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });
});
