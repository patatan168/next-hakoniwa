import sqlite from 'better-sqlite3';
/**
 * 島情報を更新する
 * @param client sqliteクライアント
 * @example
 * updateIslandPrepare.run(
 *  {uuid: 'uuid',
 *   island_name: 'island_name',
 *   prize: '[]',
 *   money: 100,
 *   food: 100,
 *   area: 100,
 *   population: 100,
 *   farm: 100,
 *   factory: 100,
 *   mining: 100,
 *   island_info: '[]'
 *  });
 * @returns 島情報更新のprepare
 */
export const updateIslandPrepare = (client: sqlite.Database) => {
  // 島情報を更新する
  const updateIsland = client.prepare(
    `UPDATE island SET (uuid, island_name, prize, money, food, area, population, farm, factory, mining, island_info) 
      =(@uuid, @island_name, jsonb(@prize), @money, @food, @area, @population, @farm, @factory, @mining, jsonb(@island_info))
     WHERE uuid = @uuid`
  );
  return updateIsland;
};
