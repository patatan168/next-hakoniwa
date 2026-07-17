import type { islandInfo, islandInfoTurnProgress } from '@/db/kysely';
import META_DATA from '@/global/define/metadata';
import { changeDataArgs, planType } from '@/global/define/planType';
import { mapArrayConverter } from '@/global/function/island';
import * as utility from '@/global/function/utility';
import { islandDataGetSet } from '@/global/store/turnProgress';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { executeMissile } from '../missile';

vi.mock('@/global/define/metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/global/define/metadata')>();
  return {
    default: {
      ...actual.default,
      MAP_SIZE: 12,
    },
  };
});

const createIsland = ({
  uuid,
  islandName,
  defaultType,
  defaultLandValue,
  money,
}: {
  uuid: string;
  islandName: string;
  defaultType: string;
  defaultLandValue: number;
  money: number;
}): islandInfoTurnProgress => {
  const islandInfo: islandInfo[] = Array.from(
    { length: META_DATA.MAP_SIZE * META_DATA.MAP_SIZE },
    (_, i) => ({
      x: i % META_DATA.MAP_SIZE,
      y: Math.floor(i / META_DATA.MAP_SIZE),
      type: defaultType,
      landValue: defaultLandValue,
    })
  ) as unknown as islandInfo[];

  return {
    uuid,
    island_name: islandName,
    prize: '',
    money,
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

const dummyPlan: planType = {
  planNo: 9999999,
  type: 'dummy_ld_missile',
  coordinate: true,
  category: '攻撃',
  name: '陸地破壊爆弾発射(ダミー)',
  description: '',
  otherIsland: true,
  immediate: false,
  mapType: ['monster', 'kujira', 'sanjira'],
  cost: 0,
  costType: 'money',
  minTimes: 0,
  maxTimes: 99,
  maxTimesPerTurn: 99,
  unit: '回',
  changeData: function ({ turn, uuid, plan }: changeDataArgs) {
    using fromIslandGetSet = islandDataGetSet(uuid.fromIsland);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`発射元の島情報が見つかりません。uuid=${uuid.fromIsland}`);

    using toIslandGetSet = islandDataGetSet(uuid.toIsland);
    const toIsland = toIslandGetSet.islandData;
    if (!toIsland) throw new Error(`発射先の島情報が見つかりません。uuid=${uuid.toIsland}`);

    const result = executeMissile({
      turn,
      fromIsland,
      toIsland,
      targetX: plan.x,
      targetY: plan.y,
      missileType: 'ld',
      times: plan.times ?? 1,
      planType: this,
    });
    plan.times = 0;

    return {
      nextPlan: this.immediate,
      log: result.logs,
      missileMonsterKills: result.monsterKills,
      missileCityKills: result.cityKills,
      missileDestroyedMaps: result.destroyedMaps,
      missileKilledMonsters: result.killedMonsters,
      missileRefugeesAccepted: result.refugeeAccepted,
    };
  },
};

const setMissileBase = (island: islandInfoTurnProgress, x: number, y: number) => {
  island.island_info[mapArrayConverter(x, y)] = {
    x,
    y,
    type: 'missile',
    landValue: 0,
  } as islandInfo;
};

describe('executeMissile land destruction hardening', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('サンジラは奇数ターンで硬化し、陸地破壊弾でもダメージを受けない', () => {
    const fromIsland = createIsland({
      uuid: 'from-uuid',
      islandName: 'From',
      defaultType: 'plains',
      defaultLandValue: 0,
      money: 1000,
    });
    setMissileBase(fromIsland, 0, 0);

    const toIsland = createIsland({
      uuid: 'to-uuid',
      islandName: 'To',
      defaultType: 'sanjira',
      defaultLandValue: 2,
      money: 9999,
    });

    vi.spyOn(utility, 'randomIntInRange').mockReturnValue(0);

    const result = executeMissile({
      turn: 1,
      fromIsland,
      toIsland,
      targetX: 5,
      targetY: 5,
      missileType: 'ld',
      times: 1,
      planType: dummyPlan,
    });

    const shallowsCount = toIsland.island_info.filter((cell) => cell.type === 'shallows').length;

    expect(result.monsterKills).toBe(0);
    expect(shallowsCount).toBe(0);
    expect(result.logs[0].log).toContain('外殻で弾かれました');
  });

  test('サンジラは偶数ターンでは硬化せず、陸地破壊弾で倒される', () => {
    const fromIsland = createIsland({
      uuid: 'from-uuid',
      islandName: 'From',
      defaultType: 'plains',
      defaultLandValue: 0,
      money: 1000,
    });
    setMissileBase(fromIsland, 0, 0);

    const toIsland = createIsland({
      uuid: 'to-uuid',
      islandName: 'To',
      defaultType: 'sanjira',
      defaultLandValue: 2,
      money: 9999,
    });

    vi.spyOn(utility, 'randomIntInRange').mockReturnValue(0);

    const result = executeMissile({
      turn: 2,
      fromIsland,
      toIsland,
      targetX: 5,
      targetY: 5,
      missileType: 'ld',
      times: 1,
      planType: dummyPlan,
    });

    const shallowsCount = toIsland.island_info.filter((cell) => cell.type === 'shallows').length;

    expect(result.monsterKills).toBe(1);
    expect(shallowsCount).toBeGreaterThanOrEqual(1);
  });
});
