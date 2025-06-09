import { createDbTable, dbConn } from '@/global/function/db';
import { eventRateSchema } from './schema/eventRateTable';
import { islandSchema } from './schema/islandTable';
import { planSchema } from './schema/planTable';
import { sessionSchema } from './schema/sessionTable';
import { turnStateSchema } from './schema/turnStateTable';
import { userSchema } from './schema/userTable';

using db = dbConn('./src/db/data/main.db');
const createTable = createDbTable(db.client);
// userテーブル作成
createTable('user', userSchema);
// islandテーブル作成
createTable('island', islandSchema);
// turn_logテーブル作成
createTable('turn_log', planSchema);
// planテーブル作成
createTable('plan', planSchema);
// event_rateテーブル作成
createTable('event_rate', eventRateSchema);
// turn_stateテーブル作成
createTable('turn_state', turnStateSchema);
db.client.prepare(`INSERT INTO turn_state`).run();
// sessionテーブル作成
createTable('session', sessionSchema);
