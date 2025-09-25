import Db from './Db';
import { DbException } from './exception/DbException';

import {
    databaseConfig,
    collectionPool
} from './config';

export { Db, DbException, databaseConfig, collectionPool };
export default Db;
