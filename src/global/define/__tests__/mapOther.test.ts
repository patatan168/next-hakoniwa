import { islandInfoTurnProgress } from '@/db/kysely';
import { mapArrayConverter } from '@/global/function/island';
import * as utility from '@/global/function/utility';
import { afterEach, describe, expect, test, vi } from 'vitest';
import * as mapOther from '../mapCategory/mapOther';
import * as mapTypeModule from '../mapType';

vi.mock('../metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../metadata')>();
  return {
    default: {
      ...actual.default,
      MAP_SIZE: 10,
    },
  };
});

const createIsland = (
  landValue: number,
  propaganda: number,
  food = 100
): islandInfoTurnProgress => {
  const mapSize = 10;
  const islandInfo = new Array(mapSize * mapSize).fill(null).map((_, i) => ({
    x: i % mapSize,
    y: Math.floor(i / mapSize),
    type: 'sea',
    landValue: 0,
  }));

  islandInfo[mapArrayConverter(0, 0)] = {
    x: 0,
    y: 0,
    type: 'people',
    landValue,
  };

  return {
    uuid: 'test-uuid',
    island_name: 'Test Island',
    prize: {},
    money: 0,
    area: 0,
    population: 0,
    food,
    farm: 0,
    factory: 0,
    mining: 0,
    artificialMonster: 0,
    fallMonument: 0,
    propaganda,
    fire: 0,
    island_info: islandInfo,
  } as unknown as islandInfoTurnProgress;
};

describe('people growth', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('propaganda=100 なら都市閾値を超えて増加する', () => {
    vi.spyOn(utility, 'randomIntInRange').mockReturnValue(2);
    vi.spyOn(mapTypeModule, 'fireDisaster').mockReturnValue(undefined);

    const island = createIsland(100, 100);

    mapOther.people.event?.({
      x: 0,
      y: 0,
      turn: 1,
      fromUuid: 'test-uuid',
      island,
    });

    expect(island.island_info[mapArrayConverter(0, 0)].landValue).toBe(102);
  });

  test('propaganda!=100 では99から増加しても100で止まる', () => {
    vi.spyOn(utility, 'randomIntInRange').mockReturnValue(2);
    vi.spyOn(mapTypeModule, 'fireDisaster').mockReturnValue(undefined);

    const island = createIsland(99, 0);

    mapOther.people.event?.({
      x: 0,
      y: 0,
      turn: 1,
      fromUuid: 'test-uuid',
      island,
    });

    expect(island.island_info[mapArrayConverter(0, 0)].landValue).toBe(100);
  });

  test('food=0 では人口が減少する', () => {
    vi.spyOn(utility, 'randomIntInRange').mockReturnValue(-3);
    vi.spyOn(mapTypeModule, 'fireDisaster').mockReturnValue(undefined);

    const island = createIsland(20, 0, 0);

    mapOther.people.event?.({
      x: 0,
      y: 0,
      turn: 1,
      fromUuid: 'test-uuid',
      island,
    });

    const peopleCell = island.island_info[mapArrayConverter(0, 0)];
    expect(peopleCell.type).toBe('people');
    expect(peopleCell.landValue).toBe(17);
  });

  test('foodが負数で人口が0以下になった場合は平地に戻る', () => {
    vi.spyOn(utility, 'randomIntInRange').mockReturnValue(-5);
    vi.spyOn(mapTypeModule, 'fireDisaster').mockReturnValue(undefined);

    const island = createIsland(2, 0, -1);

    mapOther.people.event?.({
      x: 0,
      y: 0,
      turn: 1,
      fromUuid: 'test-uuid',
      island,
    });

    const peopleCell = island.island_info[mapArrayConverter(0, 0)];
    expect(peopleCell.type).toBe('plains');
    expect(peopleCell.landValue).toBe(0);
  });
});
