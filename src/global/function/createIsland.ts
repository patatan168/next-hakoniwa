import 'server-only';

import { Database, islandInfoData, isSqlite } from '@/db/kysely';
import { Kysely, sql, Transaction } from 'kysely';
import { forest, mountain, plains, sea, shallows, wasteland } from '../define/mapCategory/mapLand';
import { defenseBase } from '../define/mapCategory/mapMilitary';
import { people } from '../define/mapCategory/mapOther';
import META_DATA from '../define/metadata';
import { calcAllTypeNum, countArea, countMapAround, getIslandInfo } from './island';

/**
 * 島を初期化する
 */
const initIsland = (): islandInfoData => {
  const initialLand = [];
  for (let y = 0; y < META_DATA.MAP_SIZE; y++) {
    for (let x = 0; x < META_DATA.MAP_SIZE; x++) {
      initialLand.push({ x: x, y: y, type: 'sea', landValue: 0 });
    }
  }
  return initialLand;
};

/**
 * 土地の初期化
 * @param data マップデータ
 * @param center 中心座標
 */
const initBaseLand = (data: islandInfoData, center: number) => {
  // 中央の4*4に荒地を配置
  for (let y = center - 1; y < center + 3; y++) {
    for (let x = center - 1; x < center + 3; x++) {
      getIslandInfo(data, x, y).type = wasteland.type;
    }
  }
  // 8*8範囲内に陸地を増殖
  for (let i = 0; i < 120; i++) {
    // ランダム座標
    const x = Math.trunc(Math.random() * 8) + center - 3;
    const y = Math.trunc(Math.random() * 8) + center - 3;

    const seaMapAround = countMapAround(data, sea.type, x, y, 1);
    const shallowsMapAround = countMapAround(data, shallows.type, x, y, 1);
    if (seaMapAround + shallowsMapAround !== 7) {
      const islandInfo = getIslandInfo(data, x, y);
      switch (islandInfo.type) {
        // 荒地は平地にする
        case wasteland.type:
          islandInfo.type = plains.type;
          break;
        // 浅瀬は荒地にする
        case shallows.type:
          islandInfo.type = wasteland.type;
          break;
        // 周りに陸地があるので浅瀬にする
        default:
          islandInfo.type = shallows.type;
          break;
      }
    }
  }
};

/**
 * 森の初期化
 * @param data マップデータ
 * @param center 中心座標
 */
const initForest = (data: islandInfoData, center: number) => {
  let tmpCount = 0;
  while (tmpCount < 4) {
    // ランダム座標
    const x = Math.trunc(Math.random() * 4) + center - 1;
    const y = Math.trunc(Math.random() * 4) + center - 1;
    const islandInfo = getIslandInfo(data, x, y);
    switch (islandInfo.type) {
      case forest.type:
        break;
      default:
        islandInfo.type = forest.type;
        islandInfo.landValue = forest.defVal;
        tmpCount++;
        break;
    }
  }
};

/**
 * 都市の初期化
 * @param data マップデータ
 * @param center 中心座標
 */
const initPeople = (data: islandInfoData, center: number) => {
  let tmpCount = 0;
  while (tmpCount < 2) {
    // ランダム座標
    const x = Math.trunc(Math.random() * 4) + center - 1;
    const y = Math.trunc(Math.random() * 4) + center - 1;
    const islandInfo = getIslandInfo(data, x, y);
    switch (islandInfo.type) {
      case forest.type:
      case people.type:
        break;
      default:
        islandInfo.type = people.type;
        // 最初は1000人
        islandInfo.landValue = 10;
        tmpCount++;
        break;
    }
  }
};

/**
 * 山の初期化
 * @param data マップデータ
 * @param center 中心座標
 */
const initMountain = (data: islandInfoData, center: number) => {
  let tmpCount = 0;
  while (tmpCount < 1) {
    // ランダム座標
    const x = Math.trunc(Math.random() * 4) + center - 1;
    const y = Math.trunc(Math.random() * 4) + center - 1;
    const islandInfo = getIslandInfo(data, x, y);
    switch (islandInfo.type) {
      case people.type:
      case forest.type:
        break;
      default:
        islandInfo.type = mountain.type;
        islandInfo.landValue = mountain.defVal;
        tmpCount++;
        break;
    }
  }
};

/**
 * 防衛基地の初期化
 * @param data マップデータ
 * @param center 中心座標
 */
const initDefenseBase = (data: islandInfoData, center: number) => {
  let tmpCount = 0;
  while (tmpCount < 1) {
    // ランダム座標
    const x = Math.trunc(Math.random() * 4) + center - 1;
    const y = Math.trunc(Math.random() * 4) + center - 1;
    const islandInfo = getIslandInfo(data, x, y);
    switch (islandInfo.type) {
      case people.type:
      case forest.type:
      case mountain.type:
        break;
      default:
        islandInfo.type = defenseBase.type;
        islandInfo.landValue = defenseBase.defVal;
        tmpCount++;
        break;
    }
  }
};

/**
 * 島を作成する
 */
export const createIsland = async (
  client: Kysely<Database> | Transaction<Database>,
  uuid: string
) => {
  const center = Math.trunc(META_DATA.MAP_SIZE / 2) - 1;
  const data: islandInfoData = initIsland();

  initBaseLand(data, center);
  initForest(data, center);
  initPeople(data, center);
  initMountain(data, center);
  initDefenseBase(data, center);

  // Transaction
  await client.transaction().execute(async (trx) => {
    // SQLite: jsonb() で BLOB として格納、MySQL: JSON 型にはそのまま文字列を渡す
    const prizeVal = isSqlite
      ? sql<string>`jsonb(${JSON.stringify([])})`
      : sql<string>`${JSON.stringify([])}`;
    const islandInfoVal = isSqlite
      ? sql<string>`jsonb(${JSON.stringify(data)})`
      : sql<string>`${JSON.stringify(data)}`;

    await trx
      .insertInto('island')
      .values({
        uuid,
        prize: prizeVal,
        money: META_DATA.INIT_MONEY,
        food: META_DATA.INIT_FOOD,
        area: countArea(data),
        population: calcAllTypeNum(data, 'people'),
        farm: calcAllTypeNum(data, 'farm'),
        factory: calcAllTypeNum(data, 'factory'),
        mining: calcAllTypeNum(data, 'mining'),
        missile: calcAllTypeNum(data, 'missile') + calcAllTypeNum(data, 'submarine_missile'),
        island_info: islandInfoVal,
      })
      .execute();

    await trx.insertInto('event_rate').values({ uuid }).execute();
  });
};
