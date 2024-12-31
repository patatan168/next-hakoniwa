import { createDbTable, dbConn } from '@/global/function/db';
import { eventRateSchema } from './schema/eventRateTable';
import { islandSchema } from './schema/islandTable';
import { sessionSchema } from './schema/sessionTable';
import { userSchema } from './schema/userTable';

using db = dbConn('./src/db/data/main.db');
const createTable = createDbTable(db.client);
// userテーブル作成
createTable('user', userSchema);
// islandテーブル作成
createTable('island', islandSchema);
// event_rateテーブル作成
createTable('event_rate', eventRateSchema);
// sessionテーブル作成
createTable('session', sessionSchema);
