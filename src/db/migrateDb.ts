/**
 * @brief データベースの移行機能
 * @note userテーブルは外部キーに使用されているので移行しない
 */
import { dbConn, migrateDbTable } from '@/global/function/db';
import { eventRateSchema } from './schema/eventRateTable';
import { islandSchema } from './schema/islandTable';
import { planSchema } from './schema/planTable';
import { sessionSchema } from './schema/sessionTable';
import { turnLogSchema } from './schema/turnLogTable';
import { turnStateSchema } from './schema/turnStateTable';

using db = dbConn('./src/db/data/main.db');
const migrateTable = migrateDbTable(db.client);
// islandテーブルを移行
migrateTable('island', islandSchema);
// turn_logテーブルを移行
migrateTable('turn_log', turnLogSchema);
// planテーブルを移行
migrateTable('plan', planSchema);
// event_rateテーブルを移行
migrateTable('event_rate', eventRateSchema);
// turn_stateテーブルを移行
migrateTable('turn_state', turnStateSchema);
// レコードが1つもない場合のみinsert
const count = db.client.prepare(`SELECT COUNT(*) as cnt FROM turn_state`).get() as { cnt: number };
if (count.cnt === 0) {
  db.client.prepare(`INSERT INTO turn_state (turn, turn_processing) VALUES (0, 0)`).run();
}
// sessionテーブルを移行
migrateTable('session', sessionSchema);
