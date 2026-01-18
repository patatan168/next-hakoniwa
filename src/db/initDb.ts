import { createDbTable, dbConn, triggerReset } from '@/global/function/db';
import { authSchema } from './schema/authTable';
import { eventRateSchema } from './schema/eventRateTable';
import { islandSchema } from './schema/islandTable';
import { lastLoginSchema } from './schema/lastLoginTable';
import { planSchema } from './schema/planTable';
import { roleSchema } from './schema/roleTable';
import { sessionSchema } from './schema/sessionTable';
import { turnLogSchema } from './schema/turnLogTable';
import { turnStateSchema } from './schema/turnStateTable';
import { userSchema } from './schema/userTable';

using db = dbConn('./src/db/data/main.db');
const createTable = createDbTable(db.client);
// トリガーを一旦全て削除してから再作成
triggerReset(db.client);
// authテーブル作成
createTable('auth', authSchema);
// roleテーブル作成
createTable('role', roleSchema);
// last_loginテーブル作成
createTable('last_login', lastLoginSchema);
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
  db.client.prepare(`INSERT INTO turn_state (turn, turn_processing) VALUES (0, 0)`).run();
}
// sessionテーブル作成
createTable('session', sessionSchema);
