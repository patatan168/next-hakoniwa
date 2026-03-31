import type { islandInfo, islandInfoTurnProgress } from '@/db/kysely';
import META_DATA from '@/global/define/metadata';
import { mapArrayConverter } from '@/global/function/island';
import * as utility from '@/global/function/utility';
import { buildIndexMap, islandDataStore } from '@/global/store/turnProgress';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { popMonsterExecute, sanitizeIslandInfoForPersistence } from '../turnProgress';

vi.mock('@/global/define/metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/global/define/metadata')>();
  return {
    default: {
      ...actual.default,
      MAP_SIZE: 12,
      MONSTER_POP_BORDER_1: 100_000,
      MONSTER_POP_BORDER_2: 250_000,
      MONSTER_POP_BORDER_3: 400_000,
    },
  };
});

vi.mock('@/db/kysely', () => ({
  isSqlite: true,
  parseJsonIslandDataTurnProgress: vi.fn(),
}));

type CreateIslandArgs = {
  population: number;
  area: number;
  monster: number;
  artificialMonster?: number;
  peopleCoords?: Array<{ x: number; y: number }>;
};

const createIsland = ({
  population,
  area,
  monster,
  artificialMonster = 0,
  peopleCoords = [{ x: 0, y: 0 }],
}: CreateIslandArgs): islandInfoTurnProgress => {
  const islandInfo: islandInfo[] = Array.from(
    { length: META_DATA.MAP_SIZE * META_DATA.MAP_SIZE },
    (_, i) => ({
      x: i % META_DATA.MAP_SIZE,
      y: Math.floor(i / META_DATA.MAP_SIZE),
      type: 'sea',
      landValue: 0,
    })
  ) as unknown as islandInfo[];

  for (const { x, y } of peopleCoords) {
    islandInfo[mapArrayConverter(x, y)] = {
      x,
      y,
      type: 'people',
      landValue: 120,
    } as islandInfo;
  }

  return {
    uuid: 'test-uuid',
    island_name: 'Test Island',
    prize: '',
    money: 0,
    area,
    population,
    food: 0,
    farm: 0,
    factory: 0,
    mining: 0,
    missile: 0,
    artificialMonster,
    fallMonument: 0,
    monster,
    island_info: islandInfo,
  } as unknown as islandInfoTurnProgress;
};

const setIslandToStore = (island: islandInfoTurnProgress) => {
  islandDataStore.setState({ data: [island], indexMap: buildIndexMap([island]) });
};

describe('popMonsterExecute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    islandDataStore.getState().reset();
  });

  test('人工怪獣がある場合は自然発生判定より先にメカいのらを出現させる', () => {
    const island = createIsland({
      population: 50_000,
      area: 50,
      monster: 0.03,
      artificialMonster: 1,
    });
    setIslandToStore(island);

    const probabilitySpy = vi.spyOn(utility, 'checkProbability').mockReturnValue(false);

    const logs = popMonsterExecute('test-uuid', 1);
    const updated = islandDataStore.getState().islandGet('test-uuid');

    expect(logs).toHaveLength(1);
    expect(updated?.island_info[mapArrayConverter(0, 0)].type).toBe('meka_inora');
    expect(logs?.[0].log).toContain('[b]都市[/b]が踏み荒らされました');
    expect(logs?.[0].log).not.toContain('[b]怪獣メカいのら[/b]が踏み荒らされました');
    expect(probabilitySpy).not.toHaveBeenCalled();
  });

  test('人口が閾値未満の場合は自然怪獣を出現させない', () => {
    const island = createIsland({
      population: 99_999,
      area: 50,
      monster: 100,
    });
    setIslandToStore(island);

    const probabilitySpy = vi.spyOn(utility, 'checkProbability').mockReturnValue(true);

    const logs = popMonsterExecute('test-uuid', 1);
    const updated = islandDataStore.getState().islandGet('test-uuid');

    expect(logs).toBeUndefined();
    expect(updated?.island_info[mapArrayConverter(0, 0)].type).toBe('people');
    expect(probabilitySpy).not.toHaveBeenCalled();
  });

  test('人口25万人帯では level2 までの怪獣候補から選ばれる', () => {
    const island = createIsland({
      population: 250_000,
      area: 100,
      monster: 100,
    });
    setIslandToStore(island);

    vi.spyOn(utility, 'checkProbability').mockReturnValue(true);
    vi.spyOn(utility, 'randomIntInRange').mockImplementation((min, max) => {
      if (min === 0 && max === 4) return 4;
      return min;
    });

    popMonsterExecute('test-uuid', 1);
    const updated = islandDataStore.getState().islandGet('test-uuid');

    expect(updated?.island_info[mapArrayConverter(0, 0)].type).toBe('inora_ghost');
  });

  test('人口40万人帯では全怪獣候補（キングいのら含む）から選ばれる', () => {
    const island = createIsland({
      population: 400_000,
      area: 100,
      monster: 100,
    });
    setIslandToStore(island);

    vi.spyOn(utility, 'checkProbability').mockReturnValue(true);
    vi.spyOn(utility, 'randomIntInRange').mockImplementation((min, max) => {
      if (min === 0 && max === 6) return 6;
      return min;
    });

    popMonsterExecute('test-uuid', 1);
    const updated = islandDataStore.getState().islandGet('test-uuid');

    expect(updated?.island_info[mapArrayConverter(0, 0)].type).toBe('king_inora');
  });
});

describe('sanitizeIslandInfoForPersistence', () => {
  test('x,y,type,landValue 以外のキーを除去する', () => {
    const source = [
      {
        x: 1,
        y: 2,
        type: 'meka_inora',
        landValue: 2,
        monsterDistance: 99,
        tempFlag: true,
      } as unknown as islandInfo,
    ];

    const sanitized = sanitizeIslandInfoForPersistence(source);

    expect(sanitized).toEqual([{ x: 1, y: 2, type: 'meka_inora', landValue: 2 }]);
    expect(sanitized[0]).not.toHaveProperty('monsterDistance');
    expect(sanitized[0]).not.toHaveProperty('tempFlag');
  });
});
