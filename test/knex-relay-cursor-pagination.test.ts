import knex, { Knex } from 'knex';
import 'pg';

import { createPgTestcontainer, StartedPgTestContainer } from './setup';
import { createPagination } from '../src';


describe('knex-relay-cursor-pagination', () => {
  let db: Knex;
  let pgContainer: StartedPgTestContainer;

  beforeAll(async () => {
    const [container, connection] = await createPgTestcontainer();
    pgContainer = container;
    db = knex({
      client: 'pg',
      connection,
      migrations: {
        directory: `${__dirname}/migrations`
      }
    });
    await db.migrate.up();
  });

  afterAll(async() => {
    await db.destroy();
    await pgContainer.stop();
  });

  test('createPagination', async () => {
    const pagination = createPagination({
      table: 'people',
      sortField: 'created',
      sortDirection: 'desc',
      cursorField: 'id',
      first: 2,
      after: '00000000-0000-0000-0000-000000000003'
    });

    const rows = await db.from('people')
      .where(pagination.where.column, pagination.where.comparator, pagination.where.value)
      .orderBy(pagination.orderBy.column, pagination.orderBy.direction)
      .limit(pagination.limit)
      .select('*');

    console.log(rows);
  });
});
