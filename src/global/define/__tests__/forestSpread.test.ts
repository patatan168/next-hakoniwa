import { islandInfoTurnProgress } from '@/db/kysely';
import { mapArrayConverter } from '@/global/function/island';
import * as utility from '@/global/function/utility';
import { islandDataStore } from '@/global/store/turnProgress';
import { afterEach, describe, expect, test, vi } from 'vitest';
import * as mapLand from '../mapCategory/mapLand';

vi.mock('../metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../metadata')>();
  return {
    default: {
      ...actual.default,
      MAP_SIZE: 10,
    },
  };
});

describe('Forest Spread', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    islandDataStore.getState().reset();
  });

  test('Forest should spread to adjacent plains', () => {
    // Mock checkProbability to always return true
    vi.spyOn(utility, 'checkProbability').mockReturnValue(true);

    const mapSize = 10;
    const islandInfo = new Array(mapSize * mapSize).fill(null).map((_, i) => ({
      x: i % mapSize,
      y: Math.floor(i / mapSize),

      type: 'sea',
      landValue: 0,
    }));

    // Set (0,0) as forest
    islandInfo[mapArrayConverter(0, 0)] = { x: 0, y: 0, type: 'forest', landValue: 100 };
    // Set (1,0) as plains
    islandInfo[mapArrayConverter(1, 0)] = { x: 1, y: 0, type: 'plains', landValue: 0 };

    const island: islandInfoTurnProgress = {
      uuid: 'test-uuid',
      island_name: 'Test Island',
      prize: {},
      money: 0,
      area: 0,
      population: 0,
      food: 0,
      farm: 0,
      factory: 0,
      mining: 0,
      artificialMonster: 0,
      fallMonument: 0,
      island_info: islandInfo,
    } as unknown as islandInfoTurnProgress;

    // We don't strictly need islandDataStore if we pass the island object directly,
    // but some internal functions might still rely on it if we hadn't fully refactored everything.
    // However, our refactor passes 'island' directly.

    // Execute plains event at (1,0)
    mapLand.plains.event?.({
      x: 1,
      y: 0,
      turn: 1,
      fromUuid: 'test-uuid',
      island: island,
    });

    // Retrieve updated state
    const targetTile = island.island_info[mapArrayConverter(1, 0)];

    expect(targetTile?.type).toBe('forest');
    expect(targetTile?.landValue).toBe(mapLand.forest.defVal);
  });
});
