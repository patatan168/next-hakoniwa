import { createDbTable, dbConn } from '@/global/function/db';
import { eventRateSchema } from './schema/eventRateTable';
import { islandSchema } from './schema/islandTable';
import { planSchema } from './schema/planTable';
import { sessionSchema } from './schema/sessionTable';
import { turnLogSchema } from './schema/turnLogTable';
import { turnStateSchema } from './schema/turnStateTable';
import { userSchema } from './schema/userTable';

using db = dbConn('./src/db/data/main.db');
const createTable = createDbTable(db.client);
// userテーブル作成
createTable('user', userSchema);
// islandテーブル作成
createTable('island', islandSchema);
// turn_logテーブル作成
createTable('turn_log', turnLogSchema);
// planテーブル作成
createTable('plan', planSchema);
// event_rateテーブル作成
createTable('event_rate', eventRateSchema);
// turn_stateテーブル作成
createTable('turn_state', turnStateSchema);
// レコードが1つもない場合のみinsert
const count = db.client.prepare(`SELECT COUNT(*) as cnt FROM turn_state`).get() as { cnt: number };
if (count.cnt === 0) {
  db.client.prepare(`INSERT INTO turn_state (turn, turn_progressing) VALUES (0, 0)`).run();
}
// sessionテーブル作成
createTable('session', sessionSchema);
