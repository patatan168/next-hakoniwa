import { islandInfoTurnProgress } from '@/db/kysely';
import { logDamageWaste, logSubmersion } from '@/global/define/logType';
import { getMapDefine } from '@/global/define/mapType';
import { buildIndexMap, islandDataStore } from '@/global/store/turnProgress';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mapArrayConverter, wideDamage } from '../island';

vi.mock('@/global/define/metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/global/define/metadata')>();
  return {
    default: {
      ...actual.default,
      MAP_SIZE: 10,
    },
  };
});

const MAP_SIZE = 10;

const createIsland = (): islandInfoTurnProgress => {
  const { defVal } = getMapDefine('sea');
  const islandInfo = new Array(MAP_SIZE * MAP_SIZE).fill(null).map((_, i) => ({
    x: i % MAP_SIZE,
    y: Math.floor(i / MAP_SIZE),
    type: 'sea',
    landValue: defVal,
  }));

  return {
    uuid: 'test-island-uuid',
    island_name: 'テスト島',
    prize: {},
    money: 0,
    area: 0,
    population: 0,
    food: 0,
    farm: 0,
    factory: 0,
    mining: 0,
    missile: 0,
    artificialMonster: 0,
    fallMonument: 0,
    propaganda: 0,
    fire: 0,
    island_info: islandInfo,
  } as unknown as islandInfoTurnProgress;
};

const setCell = (
  island: islandInfoTurnProgress,
  x: number,
  y: number,
  type: string,
  landValue = getMapDefine(type).defVal
) => {
  island.island_info[mapArrayConverter(x, y)] = { x, y, type, landValue };
};

afterEach(() => {
  islandDataStore.getState().reset();
  vi.restoreAllMocks();
});

describe('wideDamage', () => {
  test('広域被害ログは地形変更前の地形名を出力する', () => {
    const island = createIsland();
    setCell(island, 5, 5, 'plains');
    setCell(island, 5, 4, 'forest');
    setCell(island, 5, 3, 'farm');

    islandDataStore.setState({ data: [island], indexMap: buildIndexMap([island]) });

    const beforeCenter = { ...island.island_info[mapArrayConverter(5, 5)] };
    const beforeHex1 = { ...island.island_info[mapArrayConverter(5, 4)] };
    const beforeHex2 = { ...island.island_info[mapArrayConverter(5, 3)] };

    const logs = wideDamage(island.uuid, 5, 5, 100);
    const messages = logs.map((item) => item.log);

    expect(messages).toContain(logSubmersion(island, 5, 5, beforeCenter));
    expect(messages).toContain(logSubmersion(island, 5, 4, beforeHex1));
    expect(messages).toContain(logDamageWaste(island, 5, 3, beforeHex2));

    // 変更後地形(海・浅瀬・荒地)でのログが混入していないことを確認
    expect(messages).not.toContain(logSubmersion(island, 5, 5));
    expect(messages).not.toContain(logSubmersion(island, 5, 4));
    expect(messages).not.toContain(logDamageWaste(island, 5, 3));
  });
});
