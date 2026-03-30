import type { islandInfo, islandInfoTurnProgress } from '@/db/kysely';
import { mapArrayConverter } from '@/global/function/island';
import * as utility from '@/global/function/utility';
import { afterEach, describe, expect, test, vi } from 'vitest';
import * as mapFacility from '../mapCategory/mapFacility';
import * as mapFake from '../mapCategory/mapFake';
import * as mapLand from '../mapCategory/mapLand';
import * as mapMilitary from '../mapCategory/mapMilitary';
import * as mapMonster from '../mapCategory/mapMonster';
import * as mapOther from '../mapCategory/mapOther';
import * as MapType from '../mapType';
import META_DATA from '../metadata';

vi.mock('../metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../metadata')>();
  return {
    default: {
      ...actual.default,
      MAP_SIZE: 12,
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

const createMonsterIsland = (): islandInfoTurnProgress => {
  const mapSize = META_DATA.MAP_SIZE;
  const centerX = Math.floor(mapSize / 2);
  const centerY = Math.floor(mapSize / 2);

  const islandInfo: islandInfo[] = Array.from({ length: mapSize * mapSize }, (_, i) => ({
    x: i % mapSize,
    y: Math.floor(i / mapSize),
    type: 'plains',
    landValue: 0,
  })) as unknown as islandInfo[];

  islandInfo[mapArrayConverter(centerX, centerY)] = {
    x: centerX,
    y: centerY,
    type: 'meka_inora',
    landValue: 2,
  } as islandInfo;

  return {
    uuid: 'test-uuid',
    island_name: 'Test Island',
    prize: '',
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
    monster: 0,
    island_info: islandInfo,
  } as unknown as islandInfoTurnProgress;
};

describe('getMapDefine', () => {
  test('undefined => dummy', () => {
    expect(MapType.getMapDefine('test')).toEqual(mapFake.dummy);
  });
  describe('monster', () => {
    test('inora', () => {
      expect(MapType.getMapDefine('inora')).toEqual(mapMonster.inora);
    });
    test('inora_ghost', () => {
      expect(MapType.getMapDefine('inora_ghost')).toEqual(mapMonster.inoraGhost);
    });
    test('meka_inora', () => {
      expect(MapType.getMapDefine('meka_inora')).toEqual(mapMonster.mekaInora);
    });
    test('dark_inora', () => {
      expect(MapType.getMapDefine('dark_inora')).toEqual(mapMonster.darkInora);
    });
    test('red_inora', () => {
      expect(MapType.getMapDefine('red_inora')).toEqual(mapMonster.redInora);
    });
    test('king_inora', () => {
      expect(MapType.getMapDefine('king_inora')).toEqual(mapMonster.kingInora);
    });
    test('sanjira', () => {
      expect(MapType.getMapDefine('sanjira')).toEqual(mapMonster.sanjira);
    });
    test('kujira', () => {
      expect(MapType.getMapDefine('kujira')).toEqual(mapMonster.kujira);
    });
  });
  describe('land', () => {
    test('forest', () => {
      expect(MapType.getMapDefine('forest')).toEqual(mapLand.forest);
    });
    test('plains', () => {
      expect(MapType.getMapDefine('plains')).toEqual(mapLand.plains);
    });
    test('ruins', () => {
      expect(MapType.getMapDefine('ruins')).toEqual(mapLand.ruins);
    });
    test('sea', () => {
      expect(MapType.getMapDefine('sea')).toEqual(mapLand.sea);
    });
    test('shallows', () => {
      expect(MapType.getMapDefine('shallows')).toEqual(mapLand.shallows);
    });
    test('mountain', () => {
      expect(MapType.getMapDefine('mountain')).toEqual(mapLand.mountain);
    });
    test('wasteland', () => {
      expect(MapType.getMapDefine('wasteland')).toEqual(mapLand.wasteland);
    });
  });
  describe('military', () => {
    test('missile', () => {
      expect(MapType.getMapDefine('missile')).toEqual(mapMilitary.missile);
    });
    test('submarine_missile', () => {
      expect(MapType.getMapDefine('submarine_missile')).toEqual(mapMilitary.submarineMissile);
    });
    test('defense_base', () => {
      expect(MapType.getMapDefine('defense_base')).toEqual(mapMilitary.defenseBase);
    });
    test('fake_defense_base', () => {
      expect(MapType.getMapDefine('fake_defense_base')).toEqual(mapMilitary.fakeDefenseBase);
    });
  });
  describe('facility', () => {
    test('factory', () => {
      expect(MapType.getMapDefine('factory')).toEqual(mapFacility.factory);
    });
    test('farm', () => {
      expect(MapType.getMapDefine('farm')).toEqual(mapFacility.farm);
    });
    test('mining', () => {
      expect(MapType.getMapDefine('mining')).toEqual(mapFacility.mining);
    });
    test('oil_field', () => {
      expect(MapType.getMapDefine('oil_field')).toEqual(mapFacility.oilField);
    });
  });
  test('monument', () => {
    expect(MapType.getMapDefine('monument')).toEqual(mapOther.monument);
  });
  test('people', () => {
    expect(MapType.getMapDefine('people')).toEqual(mapOther.people);
  });
});

describe('getMapLevel', () => {
  describe('missile', () => {
    test('level1', () => {
      expect(MapType.getMapLevel('missile', 0)).toBe(1);
    });
    test('level2', () => {
      expect(MapType.getMapLevel('missile', 20)).toBe(2);
    });
    test('level3', () => {
      expect(MapType.getMapLevel('missile', 60)).toBe(3);
    });
    test('level4', () => {
      expect(MapType.getMapLevel('missile', 120)).toBe(4);
    });
    test('level5', () => {
      expect(MapType.getMapLevel('missile', 200)).toBe(5);
    });
  });
  describe('submarine_missile', () => {
    test('level1', () => {
      expect(MapType.getMapLevel('submarine_missile', 0)).toBe(1);
    });
    test('level2', () => {
      expect(MapType.getMapLevel('submarine_missile', 50)).toBe(2);
    });
    test('level3', () => {
      expect(MapType.getMapLevel('submarine_missile', 200)).toBe(3);
    });
  });
});

describe('monsterMove', () => {
  test('meka_inora は maxMoveDistance=1 のため2回目は移動しない', () => {
    vi.spyOn(utility, 'randomIntInRange').mockReturnValue(0);
    const mapSize = META_DATA.MAP_SIZE;
    const centerX = Math.floor(mapSize / 2);
    const centerY = Math.floor(mapSize / 2);
    const island = createMonsterIsland();

    const firstLogs = MapType.monsterMove(centerX, centerY, 1, 'test-uuid', island);
    expect(firstLogs).toHaveLength(1);
    expect(island.island_info[mapArrayConverter(centerX, centerY)].type).toBe('wasteland');

    const movedMonster = island.island_info.find((cell) => cell.type === 'meka_inora');
    expect(movedMonster).toBeDefined();
    expect(movedMonster?.monsterDistance).toBe(1);

    if (!movedMonster) throw new Error('movedMonster not found');

    const secondLogs = MapType.monsterMove(movedMonster.x, movedMonster.y, 1, 'test-uuid', island);
    expect(secondLogs).toBeUndefined();

    const remainedMonsters = island.island_info.filter((cell) => cell.type === 'meka_inora');
    expect(remainedMonsters).toHaveLength(1);
    expect(remainedMonsters[0].x).toBe(movedMonster.x);
    expect(remainedMonsters[0].y).toBe(movedMonster.y);
  });

  test('移動先が見つからないターンでは移動カウントを消費しない', () => {
    const randomSequence = [3, 3, 3, 0];
    vi.spyOn(utility, 'randomIntInRange').mockImplementation(() => randomSequence.shift() ?? 0);

    const mapSize = META_DATA.MAP_SIZE;
    const centerX = Math.floor(mapSize / 2);
    const centerY = Math.floor(mapSize / 2);
    const centerIndex = mapArrayConverter(centerX, centerY);
    const island = createMonsterIsland();

    const firstLogs = MapType.monsterMove(centerX, centerY, 1, 'test-uuid', island);
    expect(firstLogs).toBeUndefined();
    expect(island.island_info[centerIndex].type).toBe('meka_inora');
    expect(island.island_info[centerIndex].monsterDistance).toBeUndefined();

    const secondLogs = MapType.monsterMove(centerX, centerY, 1, 'test-uuid', island);
    expect(secondLogs).toHaveLength(1);
    expect(island.island_info[centerIndex].type).toBe('wasteland');

    const movedMonster = island.island_info.find((cell) => cell.type === 'meka_inora');
    expect(movedMonster).toBeDefined();
    expect(movedMonster?.monsterDistance).toBe(1);
  });
});
