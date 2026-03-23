import { Island, User } from '@/db/kysely';
import { describe, expect, test } from 'vitest';
import {
  getAchievement,
  monsterKillAchievements,
  monumentAchievements,
  peaceAchievements,
} from '../achievementType';
import { logMonsterKillAward, logMonumentAward, logPeaceAward } from '../logType';

const mockIsland = {
  uuid: 'test-uuid',
  island_name: 'テスト',
  population: 12345,
} as Island & Pick<User, 'island_name'>;

describe('achievementType', () => {
  test('monsterKillAchievements は怪獣討伐賞の閾値を持つ', () => {
    expect(monsterKillAchievements.map((a) => [a.type, a.threshold])).toEqual([
      ['monster_kill_1', 1],
      ['monster_kill_2', 5],
      ['monster_kill_3', 10],
      ['monster_kill_4', 20],
    ]);
  });

  test('monumentAchievements は記念碑賞の閾値を持つ', () => {
    expect(monumentAchievements.map((a) => [a.type, a.threshold])).toEqual([
      ['monument_1', 10],
      ['monument_2', 30],
      ['monument_3', 50],
    ]);
  });

  test('peaceAchievements は平和賞の閾値を持つ', () => {
    expect(peaceAchievements.map((a) => [a.type, a.threshold])).toEqual([
      ['peace_1', 20000],
      ['peace_2', 50000],
      ['peace_3', 100000],
    ]);
  });

  test('平和賞しきい値未満では受賞対象にならない', () => {
    const refugees = 19999;
    const achievedPeaceTypes = peaceAchievements
      .filter((a) => refugees >= a.threshold)
      .map((a) => a.type);
    expect(achievedPeaceTypes).toEqual([]);
  });

  test('平和賞しきい値ちょうどで受賞対象になる', () => {
    const refugees = 50000;
    const achievedPeaceTypes = peaceAchievements
      .filter((a) => refugees >= a.threshold)
      .map((a) => a.type);
    expect(achievedPeaceTypes).toEqual(['peace_1', 'peace_2']);
  });

  test('平和賞しきい値超過で上位賞まで受賞対象になる', () => {
    const refugees = 120000;
    const achievedPeaceTypes = peaceAchievements
      .filter((a) => refugees >= a.threshold)
      .map((a) => a.type);
    expect(achievedPeaceTypes).toEqual(['peace_1', 'peace_2', 'peace_3']);
  });

  test('turn_xxx は100ターン刻みのみ動的生成する', () => {
    expect(getAchievement('turn_200')).toEqual({
      type: 'turn_200',
      name: '200ターン杯',
      description: '200ターンに人口が一番多い島に贈られる賞。',
      condition: '200ターン経過で人口が一番多い島',
    });
    expect(getAchievement('turn_250')).toBeUndefined();
  });
});

describe('award logs', () => {
  test('logMonsterKillAward は累計怪獣討伐数を含む', () => {
    const log = logMonsterKillAward(mockIsland, '怪獣討伐王賞', 20);
    expect(log).toContain('怪獣討伐王賞');
    expect(log).toContain('累計怪獣討伐：20体');
  });

  test('logMonumentAward は累計記念碑建設数を含む', () => {
    const log = logMonumentAward(mockIsland, '究極記念碑賞', 50);
    expect(log).toContain('究極記念碑賞');
    expect(log).toContain('累計記念碑建設：50基');
  });

  test('logPeaceAward は1回の難民受入数を含む', () => {
    const log = logPeaceAward(mockIsland, '究極平和賞', 120000);
    expect(log).toContain('究極平和賞');
    expect(log).toContain('1回の難民受入：120000人');
  });
});
