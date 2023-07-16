import { Knex , knex } from 'knex';

import { createPagination } from './knex-relay-cursor-pagination';

const db: Knex = knex({});

(async () => {

  const pagination = createPagination();

  db.from('items')
    .where('creation_timestamp', '<=', '2023-05-03')
    .orderBy('creation_timestamp', 'desc')
    .limit(11)
    .select('*')

})();
