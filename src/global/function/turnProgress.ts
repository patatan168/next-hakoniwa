import { eventRateSchemaType } from '@/db/schema/eventRateTable';
import { islandData, islandSchemaType, parseJsonIslandData } from '@/db/schema/islandTable';
import { planSchemaType } from '@/db/schema/planTable';
import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { turnStateSchemaType } from '@/db/schema/turnStateTable';
import { userSchemaType } from '@/db/schema/userTable';
import sqlite from 'better-sqlite3';
import { parseDbData } from './utility';

/**
 * 放棄されていない島情報
 * @param db DB接続情報
 * @param inhabited 居住中かどうか
 * @returns 全ユーザー情報
 */
export function getInhabitedIslands(
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  inhabited: boolean
) {
  const inhabitedNum = inhabited ? 1 : 0;
  const islands = db.client
    .prepare(
      `SELECT 
        island.uuid, user.island_name,
        json(island.prize) as prize,
        island.money, island.food,
        island.area, island.population,
        island.farm, island.factory, island.mining,
        json(island.island_info) as island_info
      FROM
        user INNER JOIN island 
      ON
        user.uuid = island.uuid
      WHERE
        inhabited=${inhabitedNum}`
    )
    .all() as Array<islandSchemaType & Pick<userSchemaType, 'island_name'>>;
  islands.forEach((island) => parseJsonIslandData(island, false));
  return islands;
}

/**
 * ユーザーの計画情報を取得
 * @param db DB接続情報
 * @param uuid ユーザーUUID
 * @returns 全ユーザー情報
 */
export function getUserPlanInfo(
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  uuid: string
) {
  const plans = db.client
    .prepare(`SELECT * FROM plan WHERE from_uuid=? ORDER BY plan_no ASC`)
    .all(uuid) as planSchemaType[];
  return plans;
}

/**
 * ターン情報を取得
 * @param db DB接続情報
 * @returns 全ユーザー情報
 */
export function getTurnInfo(db: { client: sqlite.Database; [Symbol.dispose]: () => void }) {
  return db.client.prepare(`SELECT * FROM turn_state`).get() as turnStateSchemaType;
}

/**
 * ターン実行情報の更新
 * @param db DB接続情報
 * @param turnProgress ターン処理中かどうか
 * @returns 全ユーザー情報
 */
export function updateTurnProgressing(
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  turnProgress: boolean
) {
  db.client.prepare(`UPDATE turn_state SET turn_processing = ?`).run(parseDbData(turnProgress));
}

/**
 * UUIDごとの島情報の取得
 * @param islandData 全島情報
 * @param uuid UUID
 * @note 引数`islandData`とメモリーを共有
 * @returns UUIDに応じた島情報
 */
export const getIslandData = (
  islandData: Array<islandSchemaType & Pick<userSchemaType, 'island_name'>>,
  uuid: string
) => {
  return islandData[islandData.findIndex((element) => element.uuid === uuid)];
};

/**
 * イベント発生率の取得
 * @param db DB接続情報
 * @param uuid ユーザーUUID
 * @returns イベント発生率
 */
export const getEventRate = (
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  uuid: string
) =>
  db.client
    .prepare(
      `SELECT
        *
      FROM
        event_rate
      WHERE uuid=?`
    )
    .get(uuid) as eventRateSchemaType;

/**
 * 島情報の一括更新
 * @param islandData 全島情報
 * @param uuid UUID
 */
export const updateIslands = (
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  islandData: islandData
) => {
  const updateIsland = db.client.prepare(
    `UPDATE island
      SET 
        prize = jsonb(@prize),
        money = @money,
        area = @area,
        population = @population,
        food = @food,
        farm = @farm,
        factory = @factory,
        mining = @mining,
        island_info = jsonb(@island_info)
      WHERE
        uuid = @uuid`
  );
  const updateManyIslands = db.client.transaction((tmpArray: islandData) => {
    for (const tmp of tmpArray) {
      updateIsland.run({
        ...tmp,
        ...{ prize: JSON.stringify(tmp.prize), island_info: JSON.stringify(tmp.island_info) },
      });
    }
  });

  updateManyIslands(islandData);
};

/**
 * 島情報の一括更新
 * @param islandData 全島情報
 * @param logData ログ情報
 */
export const insertLogs = (
  db: { client: sqlite.Database; [Symbol.dispose]: () => void },
  logData: turnLogSchemaType[]
) => {
  const insert = db.client.prepare(
    'INSERT INTO turn_log (from_uuid, to_uuid, turn, secret_log, log) VALUES (@from_uuid, @to_uuid, @turn, @secret_log, @log)'
  );

  const insertManyLogs = db.client.transaction((logs) => {
    for (const log of logs) insert.run(log);
  });

  insertManyLogs(logData);
};
