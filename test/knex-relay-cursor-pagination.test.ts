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
        directory: `${__dirname}/migrations/swapi`
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
      after: 'MDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAx',
      // before

      // last
      first: 2,
      sortColumn: 'created_at',
      sortDirection: 'desc',

      from: 'people',
      cursorColumn: 'id',

      deobfuscateCursor: atob,
      obfuscateCursor: btoa,
      // onCursorMissing

      // after: '00000000-0000-0000-0000-000000000003',
      // deobfuscateCursor: (s) => s,
      // obfuscateCursor: (s) => s,
    });

    const query = db.from('people')
      .where(pagination.where.column, pagination.where.comparator, pagination.where.value)
      .orderBy(pagination.orderBy.column, pagination.orderBy.direction)
      .limit(pagination.limit)
      .select('*');

    const rows = await query;

    const page = pagination.getPage(rows);
    console.log(JSON.stringify(page, null, 2));
  });

  // test('cte', async () => {
  //   const cte = db.from('people')
  //     .whereLike('name', '%e%')
  //     .select('*');
  //
  //   const pagination = createPagination({
  //     from: 'cte',
  //     sortColumn: 'created_at',
  //     sortDirection: 'desc',
  //     cursorColumn: 'id',
  //     first: 2,
  //     after: '00000000-0000-0000-0000-000000000003',
  //     getCursor: (i: { id: string }) => btoa(i.id),
  //   });
  //
  //   const query = db
  //     .with('cte', cte)
  //     .from('cte')
  //     .where(pagination.where.column, pagination.where.comparator, pagination.where.value)
  //     .orderBy(pagination.orderBy.column, pagination.orderBy.direction)
  //     .limit(pagination.limit)
  //     .select('*');
  //
  //   const rows = await query;
  //   console.log(rows);
  // });
});

