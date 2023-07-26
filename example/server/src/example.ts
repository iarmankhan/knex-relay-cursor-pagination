import { Knex } from 'knex';

type a = Knex.Where;
type ComparisonOperator = '=' | '>' | '>=' | '<' | '<=' | '<>';
type WhereParams = [string, ComparisonOperator, Knex.QueryBuilder]


import { createPagination } from '../../../src/knex-relay-cursor-pagination';

const table = 'people';
const id = '00000000-0000-0000-0000-000000000003';

export async function example(db: Knex) {

  const pagination = createPagination({
    table,
    sortColumn: 'created',
    sortDirection: 'desc',
    cursorColumn: 'id',
    // first: 2,
    // after: id,
    last: 2,
    before: id,
  });


  const records = await db
    .from(table)
    .where(pagination.where.column, pagination.where.comparator, pagination.where.value)
    .orderBy(pagination.orderBy.column, pagination.orderBy.direction)
    .select('*')

  console.log(records)
  // console.log(records.reverse());
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
