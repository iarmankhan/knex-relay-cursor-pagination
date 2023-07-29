import knex, { Knex } from 'knex';
import 'pg';

import { createPagination, PaginationDatasetParams, ForwardPaginationSliceParams, Page } from '../src';

import { posts } from './data';
import { createPgTestcontainer, StartedPgTestContainer } from './setup';

describe('createPagination', () => {
  let db: Knex;
  let pgContainer: StartedPgTestContainer;

  beforeAll(async () => {
    const [container, connection] = await createPgTestcontainer();
    pgContainer = container;
    db = knex({
      client: 'pg',
      connection,
      migrations: {
        directory: `${__dirname}/migrations/blog`
      }
    });
    await db.migrate.up();
  });

  afterAll(async () => {
    await db.destroy();
    await pgContainer.stop();
  });

  describe('paging variants', () => {
    const baseParams: PaginationDatasetParams = {
      from: 'posts',
      sortColumn: 'creation_timestamp',
      sortDirection: 'desc',
      cursorColumn: 'id'
    };

    describe('forward paging', () => {
      const sortedPosts = posts.sort((a, b) => b.creation_timestamp.getTime() - a.creation_timestamp.getTime());

      interface ForwardPagingTestCase {
        sliceParams: ForwardPaginationSliceParams;
        expected: Page;
      }

      const cases: Array<[string, ForwardPagingTestCase]> = [
        [
          '0...end at limit',
          {
            sliceParams: { first: posts.length },
            expected: {
              edges: sortedPosts.map(post => ({
                node: post,
                cursor: expect.any(String)
              })) as any,
              pageInfo: {
                startCursor: undefined,
                endCursor: expect.any(String),
                hasPreviousPage: false,
                hasNextPage: false
              }
            },
          },
        ],
        // [
        //   '0...end at under limit',
        //   {
        //     sliceParams: { first: posts.length + 1 },
        //     expected: sortedPosts,
        //   }
        // ]

        /*
        0...end
          at limit
          under limit
        0...m
        n...m
        n...end
          at limit
          under limit

         */
      ];


      test.each(cases)('%s', async (_, testCase: ForwardPagingTestCase) => {
        const pagination = createPagination({
          ...baseParams,
          ...testCase.sliceParams,
        });

        const rows = await db.from('posts')
          .where(pagination.where.column, pagination.where.comparator, pagination.where.value)
          .orderBy(pagination.orderBy.column, pagination.orderBy.direction)
          .limit(pagination.limit)
          .select('*');

        expect(pagination.getPage(rows)).toEqual(testCase.expected);
      });
    });
  });

});

/*

0...end
  at limit
  under limit
0...m
n...m
n...end
  at limit
  under limit

forward
backward

with common-table-expression

obfuscateCursor custom
deobfuscateCursor custom
onCursorMissing
  throw
  omit
 */
