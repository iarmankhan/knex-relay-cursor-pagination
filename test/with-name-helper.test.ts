import { KnexNameUtil } from 'knex-name-util';
import knex, { Knex } from 'knex';
import { createPgTestcontainer, StartedPgTestContainer } from './setup';
import { createPagination } from '../src';

const peopleTable = new KnexNameUtil('people', {
  id: 'id',
  name: 'name',
  createdAt: 'created_at',
});

describe('with name util', () => {
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

  test('', async () => {
    const pagination = createPagination({
      from: peopleTable.name,
      sortColumn: {
        column: peopleTable.column('createdAt'),
        alias: peopleTable.prefixedAlias('createdAt'),
      },
      sortDirection: 'desc',
      cursorColumn: {
        column: peopleTable.column('id'),
        alias: peopleTable.prefixedAlias('id'),
      },
      first: 2,
      after: '00000000-0000-0000-0000-000000000003'
    });

    const rows = await db.from(peopleTable.name)
      .where(pagination.where.column, pagination.where.comparator, pagination.where.value)
      .orderBy(pagination.orderBy.column, pagination.orderBy.direction)
      .limit(pagination.limit)
      .select<Person[]>(peopleTable.selectAll());

    console.log(rows);
  });
});

interface Person {}
