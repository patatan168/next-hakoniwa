/**
 * @module collection
 * @description 配列とオブジェクト操作の共通ユーティリティ。
 */

type Primitive = string | number | bigint | boolean | symbol | null | undefined;
type Iteratee<T> = keyof T | ((value: T) => unknown);
type PairMemo = WeakMap<object, WeakSet<object>>;

const hasOwn = Object.prototype.hasOwnProperty;
const isEnumerable = Object.prototype.propertyIsEnumerable;

const isObjectLike = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

const isPrimitive = (value: unknown): value is Primitive => {
  return value === null || (typeof value !== 'object' && typeof value !== 'function');
};

const hasSeen = (a: object, b: object, memo: PairMemo) => {
  const targets = memo.get(a);
  return targets?.has(b) ?? false;
};

const rememberPair = (a: object, b: object, memo: PairMemo) => {
  let targets = memo.get(a);
  if (!targets) {
    targets = new WeakSet<object>();
    memo.set(a, targets);
  }
  targets.add(b);
};

const compareNullableOrder = (a: unknown, b: unknown): number | null => {
  const isLeftNullable = a === null || a === undefined;
  const isRightNullable = b === null || b === undefined;
  if (!isLeftNullable && !isRightNullable) return null;
  if (isLeftNullable && isRightNullable) return 0;
  return isLeftNullable ? 1 : -1;
};

const compareNumberOrder = (a: unknown, b: unknown): number | null => {
  if (typeof a !== 'number' || typeof b !== 'number') return null;
  if (Number.isNaN(a)) return Number.isNaN(b) ? 0 : 1;
  if (Number.isNaN(b)) return -1;
  return a - b;
};

const compareBigintOrder = (a: unknown, b: unknown): number | null => {
  if (typeof a !== 'bigint' || typeof b !== 'bigint') return null;
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

const compareBooleanOrder = (a: unknown, b: unknown): number | null => {
  if (typeof a !== 'boolean' || typeof b !== 'boolean') return null;
  return Number(a) - Number(b);
};

const compareStringOrder = (a: unknown, b: unknown): number | null => {
  if (typeof a !== 'string' || typeof b !== 'string') return null;
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

const compareDateOrder = (a: unknown, b: unknown): number | null => {
  if (!(a instanceof Date) || !(b instanceof Date)) return null;
  return a.getTime() - b.getTime();
};

const compareOrder = (a: unknown, b: unknown): number => {
  if (Object.is(a, b)) return 0;

  const nullable = compareNullableOrder(a, b);
  if (nullable !== null) return nullable;

  const byNumber = compareNumberOrder(a, b);
  if (byNumber !== null) return byNumber;

  const byBigint = compareBigintOrder(a, b);
  if (byBigint !== null) return byBigint;

  const byBoolean = compareBooleanOrder(a, b);
  if (byBoolean !== null) return byBoolean;

  const byString = compareStringOrder(a, b);
  if (byString !== null) return byString;

  const byDate = compareDateOrder(a, b);
  if (byDate !== null) return byDate;

  const left = String(a);
  const right = String(b);
  if (left === right) return 0;
  return left < right ? -1 : 1;
};

const getIterateeValue = <T>(value: T, iteratee: Iteratee<T>) => {
  if (typeof iteratee === 'function') {
    return iteratee(value);
  }

  if (value === null || value === undefined) return undefined;

  return (value as Record<PropertyKey, unknown>)[iteratee as PropertyKey];
};

const compareDate = (a: object, b: object): boolean | undefined => {
  if (!(a instanceof Date) && !(b instanceof Date)) return undefined;
  if (!(a instanceof Date) || !(b instanceof Date)) return false;
  return a.getTime() === b.getTime();
};

const compareRegExp = (a: object, b: object): boolean | undefined => {
  if (!(a instanceof RegExp) && !(b instanceof RegExp)) return undefined;
  if (!(a instanceof RegExp) || !(b instanceof RegExp)) return false;
  return a.source === b.source && a.flags === b.flags;
};

const compareArray = (a: object, b: object, memo: PairMemo): boolean | undefined => {
  if (!Array.isArray(a) && !Array.isArray(b)) return undefined;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (!isEqualInternal(a[i], b[i], memo)) return false;
  }

  return true;
};

const compareArrayBufferView = (a: object, b: object): boolean | undefined => {
  if (!ArrayBuffer.isView(a) && !ArrayBuffer.isView(b)) return undefined;
  if (!ArrayBuffer.isView(a) || !ArrayBuffer.isView(b)) return false;
  if (a.byteLength !== b.byteLength) return false;

  const left = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  const right = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return false;
  }

  return true;
};

const compareMap = (a: object, b: object, memo: PairMemo): boolean | undefined => {
  if (!(a instanceof Map) && !(b instanceof Map)) return undefined;
  if (!(a instanceof Map) || !(b instanceof Map)) return false;
  if (a.size !== b.size) return false;

  for (const [keyA, valueA] of a.entries()) {
    let found = false;
    for (const [keyB, valueB] of b.entries()) {
      if (isEqualInternal(keyA, keyB, memo) && isEqualInternal(valueA, valueB, memo)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }

  return true;
};

const compareSet = (a: object, b: object, memo: PairMemo): boolean | undefined => {
  if (!(a instanceof Set) && !(b instanceof Set)) return undefined;
  if (!(a instanceof Set) || !(b instanceof Set)) return false;
  if (a.size !== b.size) return false;

  for (const valueA of a.values()) {
    let found = false;
    for (const valueB of b.values()) {
      if (isEqualInternal(valueA, valueB, memo)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }

  return true;
};

const compareEnumerableKeys = (a: object, b: object, memo: PairMemo): boolean => {
  const keysA = Reflect.ownKeys(a).filter((key) => isEnumerable.call(a, key));
  const keysB = Reflect.ownKeys(b).filter((key) => isEnumerable.call(b, key));
  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!hasOwn.call(b, key)) return false;

    const valueA = (a as Record<PropertyKey, unknown>)[key];
    const valueB = (b as Record<PropertyKey, unknown>)[key];
    if (!isEqualInternal(valueA, valueB, memo)) return false;
  }

  return true;
};

const isEqualInternal = (a: unknown, b: unknown, memo: PairMemo): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (!isObjectLike(a) || !isObjectLike(b)) return false;

  if (hasSeen(a, b, memo) || hasSeen(b, a, memo)) return true;
  rememberPair(a, b, memo);
  rememberPair(b, a, memo);

  const dateResult = compareDate(a, b);
  if (dateResult !== undefined) return dateResult;

  const regExpResult = compareRegExp(a, b);
  if (regExpResult !== undefined) return regExpResult;

  const arrayResult = compareArray(a, b, memo);
  if (arrayResult !== undefined) return arrayResult;

  const arrayBufferResult = compareArrayBufferView(a, b);
  if (arrayBufferResult !== undefined) return arrayBufferResult;

  const mapResult = compareMap(a, b, memo);
  if (mapResult !== undefined) return mapResult;

  const setResult = compareSet(a, b, memo);
  if (setResult !== undefined) return setResult;

  return compareEnumerableKeys(a, b, memo);
};

/**
 * 値同士をディープ比較する
 */
export const isEqual = (a: unknown, b: unknown): boolean => {
  return isEqualInternal(a, b, new WeakMap<object, WeakSet<object>>());
};

/**
 * 配列から重複を除外する
 */
export const uniqBy = <T>(array: readonly T[], iteratee: Iteratee<T>): T[] => {
  const primitiveSeen = new Set<Primitive>();
  const complexSeen: unknown[] = [];
  const result: T[] = [];

  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    const key = getIterateeValue(value, iteratee);

    if (isPrimitive(key)) {
      if (primitiveSeen.has(key)) continue;
      primitiveSeen.add(key);
      result.push(value);
      continue;
    }

    const duplicated = complexSeen.some((seen) => isEqual(seen, key));
    if (duplicated) continue;

    complexSeen.push(key);
    result.push(value);
  }

  return result;
};

/**
 * 指定キーまたは関数で昇順ソートする
 * @param array ソート対象の配列
 * @param iteratees ソートの基準となるキー名または関数の配列
 * @returns ソートされた新しい配列
 * @example
 * const data = [
 *   { name: 'Alice', age: 30 },
 *   { name: 'Bob', age: 25 },
 *   { name: 'Charlie', age: 30 },
 * ];
 * const sorted = sortBy(data, ['age', 'name']);
 * console.log(sorted);
 * // [
 * //   { name: 'Bob', age: 25 },
 * //   { name: 'Alice', age: 30 },
 * //   { name: 'Charlie', age: 30 },
 * // ]
 * @description
 * この関数は、指定されたキー名や関数を基準にして、配列を昇順でソートします。
 * 複数の基準を指定した場合は、順番に比較していき、最初の基準で差がついた時点でソート順が決まります。
 * ソートは安定であり、元の配列は変更されません。
 * @memberof collection
 */
export const sortBy = <T>(
  array: readonly T[],
  iteratees: Iteratee<T> | readonly Iteratee<T>[]
): T[] => {
  const normalized = Array.isArray(iteratees) ? iteratees : [iteratees];
  if (normalized.length === 0) return [...array];

  return [...array].sort((left, right) => {
    for (let i = 0; i < normalized.length; i++) {
      const iteratee = normalized[i];
      const diff = compareOrder(
        getIterateeValue(left, iteratee),
        getIterateeValue(right, iteratee)
      );
      if (diff !== 0) return diff;
    }
    return 0;
  });
};

/**
 * 指定キーを除いたオブジェクトを返す
 * @param value 元のオブジェクト
 * @param keys 除外するキーの配列
 * @returns 指定キーを除いた新しいオブジェクト
 * @example
 * const original = { a: 1, b: 2, c: 3 };
 * const result = omit(original, ['b']);
 * console.log(result); // { a: 1, c: 3 }
 * console.log(original); // { a: 1, b: 2, c: 3 } - 元のオブジェクトは変更されない
 * @description
 * この関数は、元のオブジェクトを変更せずに、指定されたキーを除外した新しいオブジェクトを返します。
 * 内部的には、除外するキーをセットにして高速に判定し、列挙可能なプロパティのみを対象としています。
 * @memberof collection
 */
export const omit = <T extends object, K extends keyof T>(
  value: T,
  keys: readonly K[]
): Omit<T, K> => {
  const removeSet = new Set<PropertyKey>(keys as readonly PropertyKey[]);
  const source = value as Record<PropertyKey, unknown>;
  const result: Record<PropertyKey, unknown> = {};

  for (const key of Reflect.ownKeys(source)) {
    if (!isEnumerable.call(source, key)) continue;
    if (removeSet.has(key)) continue;
    result[key] = source[key];
  }

  return result as Omit<T, K>;
};

/**
 * 指定キーのみ抽出したオブジェクトを返す
 * @param value 元のオブジェクト
 * @param keys 抽出するキーの配列
 * @returns 指定キーのみを含む新しいオブジェクト
 * @example
 * const original = { a: 1, b: 2, c: 3 };
 * const result = pick(original, ['a', 'c']);
 * console.log(result); // { a: 1, c: 3 }
 * console.log(original); // { a: 1, b: 2, c: 3 } - 元のオブジェクトは変更されない
 * @description
 * この関数は、元のオブジェクトを変更せずに、指定されたキーのみを含む新しいオブジェクトを返します。
 * 内部的には、抽出するキーをセットにして高速に判定し、列挙可能なプロパティのみを対象としています。
 * @memberof collection
 */
export const pick = <T extends object, K extends keyof T>(
  value: T,
  keys: readonly K[]
): Pick<T, K> => {
  const source = value as Record<PropertyKey, unknown>;
  const result: Record<PropertyKey, unknown> = {};

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as PropertyKey;
    if (!hasOwn.call(source, key)) continue;
    result[key] = source[key];
  }

  return result as Pick<T, K>;
};
