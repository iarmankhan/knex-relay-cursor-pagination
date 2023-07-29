import knex, { Knex } from 'knex';
import 'pg';

import { createPagination, PaginationDatasetParams, ForwardPaginationSliceParams, BackwardPaginationSliceParams, Page } from '../src';

import { posts } from './data';
import { createPgTestcontainer, StartedPgTestContainer } from './setup';

interface ForwardPagingTestCase {
  sliceParams: ForwardPaginationSliceParams;
  expected: Page;
}

interface BackwardPagingTestCase {
  sliceParams: BackwardPaginationSliceParams;
  expected: Page;
}

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

    const sortedPosts = [...posts].sort((a, b) => b.creation_timestamp.getTime() - a.creation_timestamp.getTime());

    describe('forward paging', () => {
      const cases: Array<[string, ForwardPagingTestCase]> = [
        [
          'first...last, row-count at limit',
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
          'first...last, row-count under limit',
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
          'first...n',
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
          'm...n',
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
          'm...last, row-count at limit',
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
          'm...last, row-count under limit',
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

    describe('backward paging', () => {
      const cases: Array<[string, BackwardPagingTestCase]> = [
        [
          'last...first, row-count at limit',
          {
            sliceParams: { last: posts.length },
            expected: {
              edges: [...sortedPosts].reverse().map(post => ({
                node: post,
                cursor: btoa(post.id)
              })) as any,
              pageInfo: {
                startCursor: btoa(sortedPosts.at(-1)!.id),
                endCursor: btoa(sortedPosts[0].id),
                hasPreviousPage: false,
                hasNextPage: false
              }
            },
          }
        ],
        [
          'last...first, row-count under limit',
          {
            sliceParams: { last: posts.length + 1 },
            expected: {
              edges: [...sortedPosts].reverse().map(post => ({
                node: post,
                cursor: btoa(post.id)
              })) as any,
              pageInfo: {
                startCursor: btoa(sortedPosts.at(-1)!.id),
                endCursor: btoa(sortedPosts[0]!.id),
                hasPreviousPage: false,
                hasNextPage: false
              }
            },
          }
        ],
        [
          'last...m',
          {
            sliceParams: { last: 3 },
            expected: {
              edges: [
                {
                  node: sortedPosts.at(-1),
                  cursor: btoa(sortedPosts.at(-1)!.id)
                },
                {
                  node: sortedPosts.at(-2),
                  cursor: btoa(sortedPosts.at(-2)!.id)
                },
                {
                  node: sortedPosts.at(-3),
                  cursor: btoa(sortedPosts.at(-3)!.id)
                }
              ],
              pageInfo: {
                startCursor: btoa(sortedPosts.at(-1)!.id),
                endCursor: btoa(sortedPosts.at(-3)!.id),
                hasPreviousPage: true,
                hasNextPage: false,
              }
            },
          }
        ],
        [
          'n...m',
          {
            sliceParams: {
              last: 3,
              before: btoa(sortedPosts.at(-3)!.id)
            },
            expected: {
              edges: [
                {
                  node: sortedPosts.at(-4),
                  cursor: btoa(sortedPosts.at(-4)!.id)
                },
                {
                  node: sortedPosts.at(-5),
                  cursor: btoa(sortedPosts.at(-5)!.id)
                },
                {
                  node: sortedPosts.at(-6),
                  cursor: btoa(sortedPosts.at(-6)!.id)
                }
              ],
              pageInfo: {
                startCursor: btoa(sortedPosts.at(-4)!.id),
                endCursor: btoa(sortedPosts.at(-6)!.id),
                hasPreviousPage: true,
                hasNextPage: true
              }
            },
          }
        ],
        [
          'm...first, row-count at limit',
          {
            sliceParams: {
              last: 3,
              before: btoa(sortedPosts[3].id)
            },
            expected: {
              edges: [
                {
                  node: sortedPosts[2],
                  cursor: btoa(sortedPosts[2].id)
                },
                {
                  node: sortedPosts[1],
                  cursor: btoa(sortedPosts[1].id)
                },
                {
                  node: sortedPosts[0],
                  cursor: btoa(sortedPosts[0].id)
                },
              ],
              pageInfo: {
                startCursor: btoa(sortedPosts[2].id),
                endCursor: btoa(sortedPosts[0].id),
                hasPreviousPage: false,
                hasNextPage: true
              }
            },
          }
        ],
        [
          'm...first, row-count under limit',
          {
            sliceParams: {
              last: 4,
              before: btoa(sortedPosts[3].id)
            },
            expected: {
              edges: [
                {
                  node: sortedPosts[2],
                  cursor: btoa(sortedPosts[2].id)
                },
                {
                  node: sortedPosts[1],
                  cursor: btoa(sortedPosts[1].id)
                },
                {
                  node: sortedPosts[0],
                  cursor: btoa(sortedPosts[0].id)
                },
              ],
              pageInfo: {
                startCursor: btoa(sortedPosts[2].id),
                endCursor: btoa(sortedPosts[0].id),
                hasPreviousPage: false,
                hasNextPage: true
              }
            },
          }
        ]
      ];

      test.each(cases)('%s', async (_, testCase: BackwardPagingTestCase) => {
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

  describe('query from a common-table-expression', () => {
    const baseParams: PaginationDatasetParams = {
      from: 'cte',
      sortColumn: 'comments_count',
      sortDirection: 'desc',
      cursorColumn: 'id',
    };

    const cases: Array<[string, ForwardPagingTestCase]> = [
      [
        'first...last',
        {
          sliceParams: { first: 20 },
          expected: {
            edges: [
              {
                node: { ...posts[4], comments_count: '5' },
                cursor: btoa(posts[4].id)
              },
              {
                node: { ...posts[0], comments_count: '4' },
                cursor: btoa(posts[0].id)
              },
              {
                node: { ...posts[3], comments_count: '2' },
                cursor: btoa(posts[3].id)
              },
              {
                node: { ...posts[2], comments_count: '2' },
                cursor: btoa(posts[2].id)
              },
              {
                node: { ...posts[6], comments_count: '1' },
                cursor: btoa(posts[6].id)
              },
              {
                node: { ...posts[7], comments_count: '0' },
                cursor: btoa(posts[7].id)
              },
              {
                node: { ...posts[1], comments_count: '0' },
                cursor: btoa(posts[1].id)
              },
              {
                node: { ...posts[5], comments_count: '0' },
                cursor: btoa(posts[5].id)
              },
            ],
            pageInfo: {
              startCursor: btoa(posts[4].id),
              endCursor: btoa(posts[5].id),
              hasPreviousPage: false,
              hasNextPage: false,
            }
          }
        }
      ],
      [
        'm...n',
        {
          sliceParams: {
            first: 3,
            after: btoa('00000000-0000-0000-0000-000000000003')
          },
          expected: {
            edges: [
              {
                node: { ...posts[2], comments_count: '2' },
                cursor: btoa(posts[2].id)
              },
              {
                node: { ...posts[6], comments_count: '1' },
                cursor: btoa(posts[6].id)
              },
              {
                node: { ...posts[7], comments_count: '0' },
                cursor: btoa(posts[7].id)
              },
            ],
            pageInfo: {
              startCursor: btoa(posts[2].id),
              endCursor: btoa(posts[7].id),
              hasPreviousPage: true,
              hasNextPage: true,
            }
          }
        }
      ]
    ];

    test.each(cases)('%s', async (_, testCase) => {
      const cte = db.from('posts')
        .select('posts.*')
        .count('comments.id as comments_count')
        .leftJoin('comments', 'posts.id', 'comments.post_id')
        .groupBy('posts.id')
        .orderBy('comments_count', 'desc');

      const pagination = createPagination({
        ...baseParams,
        ...testCase.sliceParams,
      });

      const query = db
        .with('cte', cte)
        .from('cte')
        .where(pagination.where.column, pagination.where.comparator, pagination.where.value)
        .orderBy(pagination.orderBy.column, pagination.orderBy.direction)
        .limit(pagination.limit)
        .select('*');

      console.log(query.toSQL().sql);
      const rows = await query;

      console.log('actual', JSON.stringify(pagination.getPage(rows), null, 2));
      // console.log('expected', JSON.stringify(testCase.expected, null, 2))
      // console.log([
      //   posts[4],
      //   posts[0],
      //   posts[3],
      //   posts[2],
      //   posts[6],
      //   posts[7],
      //   posts[1],
      //   posts[5]
      // ])

      expect(pagination.getPage(rows)).toEqual(testCase.expected);
    });
  });
});

/*
with common-table-expression

obfuscateCursor custom
deobfuscateCursor custom
onCursorMissing
  throw
  omit
 */
