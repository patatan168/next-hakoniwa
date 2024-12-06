import { islandInfoData } from '@/db/schema/islandTable';
import sqlite from 'better-sqlite3';
import { forest, mountain, people, plains, sea, shallows, wasteland } from '../define/mapType';
import META_DATA from '../define/metadata';
import {
  calcAllTypeNum,
  countArea,
  countAround,
  getIslandInfo,
  getPublicIslandInfo,
} from './island';

/**
 * 島を初期化する
 */
const initIsland = (): islandInfoData => {
  const initialLand = [];
  for (let y = 0; y < META_DATA.MapSize; y++) {
    for (let x = 0; x < META_DATA.MapSize; x++) {
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

    const seaCountAround = countAround(data, sea.type, x, y, 1);
    if (seaCountAround !== 7) {
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
        islandInfo.type = mountain.type;
        islandInfo.landValue = mountain.defVal;
        tmpCount++;
        break;
    }
  }
};

/**
 * 島を作成する
 */
export const createIsland = (client: sqlite.Database, uuid: string, islandName: string) => {
  const center = Math.trunc(META_DATA.MapSize / 2);
  const data: islandInfoData = initIsland();

  initBaseLand(data, center);
  initForest(data, center);
  initPeople(data, center);
  initMountain(data, center);
  initDefenseBase(data, center);

  const insertSession = client.prepare(
    `INSERT INTO island(uuid, island_name, prize, money, area, population, farm, factory, mining, island_info, public_island_info) 
      values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const publicData = getPublicIslandInfo(data);

  insertSession.run(
    uuid,
    islandName,
    JSON.stringify([]),
    1000,
    countArea(data),
    calcAllTypeNum(data, 'people'),
    calcAllTypeNum(data, 'farm'),
    calcAllTypeNum(data, 'factory'),
    calcAllTypeNum(data, 'mining'),
    JSON.stringify(data),
    JSON.stringify(publicData)
  );
};
