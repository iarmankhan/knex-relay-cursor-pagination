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
          '0...end, row-count at limit',
          {
            sliceParams: { first: posts.length },
            expected: {
              edges: sortedPosts.map(post => ({
                node: post,
                cursor: btoa(post.id)
              })) as any,
              pageInfo: {
                startCursor: btoa(sortedPosts[0].id),
                endCursor: btoa(sortedPosts.at(-1)!.id),
                hasPreviousPage: false,
                hasNextPage: false
              }
            },
          },
        ],
        [
          '0...end, row-count under limit',
          {
            sliceParams: { first: posts.length + 1 },
            expected: {
              edges: sortedPosts.map(post => ({
                node: post,
                cursor: btoa(post.id)
              })) as any,
              pageInfo: {
                startCursor: btoa(sortedPosts[0].id),
                endCursor: btoa(sortedPosts.at(-1)!.id),
                hasPreviousPage: false,
                hasNextPage: false
              }
            },
          }
        ],
        [
          '0...m',
          {
            sliceParams: { first: 3 },
            expected: {
              edges: [
                {
                  node: sortedPosts[0],
                  cursor: btoa(sortedPosts[0].id)
                },
                {
                  node: sortedPosts[1],
                  cursor: btoa(sortedPosts[1].id)
                },
                {
                  node: sortedPosts[2],
                  cursor: btoa(sortedPosts[2].id)
                }
              ],
              pageInfo: {
                startCursor: btoa(sortedPosts[0].id),
                endCursor: btoa(sortedPosts.at(2)!.id),
                hasPreviousPage: false,
                hasNextPage: true
              }
            },
          }
        ],
        [
          'n...m',
          {
            sliceParams: {
              first: 3,
              after: btoa(sortedPosts[2].id)
            },
            expected: {
              edges: [
                {
                  node: sortedPosts[3],
                  cursor: btoa(sortedPosts[3].id)
                },
                {
                  node: sortedPosts[4],
                  cursor: btoa(sortedPosts[4].id)
                },
                {
                  node: sortedPosts[5],
                  cursor: btoa(sortedPosts[5].id)
                }
              ],
              pageInfo: {
                startCursor: btoa(sortedPosts[3].id),
                endCursor: btoa(sortedPosts.at(5)!.id),
                hasPreviousPage: true,
                hasNextPage: true
              }
            },
          }
        ],
        [
          'n...end, row-count at limit',
          {
            sliceParams: {
              first: 3,
              after: btoa(sortedPosts.at(-4)!.id)
            },
            expected: {
              edges: [
                {
                  node: sortedPosts.at(-3),
                  cursor: btoa(sortedPosts.at(-3)!.id)
                },
                {
                  node: sortedPosts.at(-2),
                  cursor: btoa(sortedPosts.at(-2)!.id)
                },
                {
                  node: sortedPosts.at(-1),
                  cursor: btoa(sortedPosts.at(-1)!.id)
                }
              ],
              pageInfo: {
                startCursor: btoa(sortedPosts.at(-3)!.id),
                endCursor: btoa(sortedPosts.at(-1)!.id),
                hasPreviousPage: true,
                hasNextPage: false
              }
            },
          }
        ],
        [
          'n...end, row-count under limit',
          {
            sliceParams: {
              first: 4,
              after: btoa(sortedPosts.at(-4)!.id)
            },
            expected: {
              edges: [
                {
                  node: sortedPosts.at(-3),
                  cursor: btoa(sortedPosts.at(-3)!.id)
                },
                {
                  node: sortedPosts.at(-2),
                  cursor: btoa(sortedPosts.at(-2)!.id)
                },
                {
                  node: sortedPosts.at(-1),
                  cursor: btoa(sortedPosts.at(-1)!.id)
                }
              ],
              pageInfo: {
                startCursor: btoa(sortedPosts.at(-3)!.id),
                endCursor: btoa(sortedPosts.at(-1)!.id),
                hasPreviousPage: true,
                hasNextPage: false
              }
            },
          }
        ]
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
