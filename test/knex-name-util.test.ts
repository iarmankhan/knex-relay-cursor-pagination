import knex, { Knex } from 'knex';
import { KnexNameUtil } from 'knex-name-util';

import { createPagination } from '../src';

import { createPgTestcontainer, StartedPgTestContainer } from './setup';
import { posts } from './data';

describe('createPagination with knex-name-util', () => {
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

  afterAll(async () => {
    await db.destroy();
    await pgContainer.stop();
  });

  interface Post {
    id: string;
    title: string;
    creationTimestamp: string;
  }

  test('', async () => {
    const postsTable = new KnexNameUtil('posts', {
      id: 'id',
      title: 'title',
      creationTimestamp: 'creation_timestamp',
    });

    const pagination = createPagination({
      from: postsTable.name,
      sortColumn: {
        column: postsTable.column('creationTimestamp'),
        alias: postsTable.prefixedAlias('creationTimestamp'),
      },
      sortDirection: 'desc',
      cursorColumn: {
        column: postsTable.column('id'),
        alias: postsTable.prefixedAlias('id'),
      },
      first: 3,
      after: btoa(posts[5].id,)
    });

    const rows: Record<string, unknown>[] = await db.from(postsTable.name)
      .where(pagination.where.column, pagination.where.comparator, pagination.where.value)
      .orderBy(pagination.orderBy.column, pagination.orderBy.direction)
      .limit(pagination.limit)
      .select(postsTable.selectAll());

    const page = pagination.getPage(rows, {
      mapItem: postsTable.toAlias
    });
    console.log(page.edges);

    // const edges = page.edges.map(edge => ({ ...edge, node: postsTable.toAlias(edge.node) }))
    // console.log(edges);


    // console.log(rows.map(row => (row)));
    // console.log('------')
    // console.log(page.edges.map(edge => (edge.node)));

    // console.log(JSON.stringify(page.edges, null, 2))


    // console.log(rows.map(postsTable.toAlias));




    // const edges = page.edges.map(edge => {
    //   console.log(edge.node, postsTable.toAlias(edge.node))
    //   return {
    //     ...edge,
    //     node: postsTable.toAlias(edge.node),
    //   }
    // });
    //
    // console.log(edges);
  });
});
