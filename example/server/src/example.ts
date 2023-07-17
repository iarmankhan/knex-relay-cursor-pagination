import { Knex } from 'knex';

import { createPagination } from '../../../src/knex-relay-cursor-pagination';

const table = 'people';
const id = '00000000-0000-0000-0000-000000000003';

export async function example(db: Knex) {

  const pagination = createPagination({
    table,
    sortField: 'created',
    sortDirection: 'desc',
    cursorField: 'id',
    // first: 2,
    // after: id,
    last: 2,
    before: id,
  });

  const records = await db
    .from(table)
    .where(...(pagination.where as [any, any, any]))
    .orderBy(...pagination.orderBy)
    .limit(pagination.limit)
    .select('*')

  console.log(records);
}


/*

const records = await db
  .from('people')
  .select()
  .where('created', '<', subquery => {
    return subquery
      .from('people')
      .select('created')
      .where('id', id)
      .first()
  })
  .orderBy('created', 'desc')
  .limit(2);

 */
