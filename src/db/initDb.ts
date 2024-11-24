import { createDbTable, dbConn } from '@/global/function/db';
import { islandSchema } from './schema/islandTable';
import { userSchema } from './schema/userTable';

using db = dbConn('./src/db/data/main.db');
const createTable = createDbTable(db.client);
// userテーブル作成
createTable('user', userSchema);
// islandテーブル作成
createTable('island', islandSchema);
