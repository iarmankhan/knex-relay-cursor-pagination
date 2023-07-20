import { Knex } from 'knex';

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export type PaginationParams =
  PaginationSliceParams & {
  from: string;
  cursorField: CursorField;
  sortField: string;
  sortDirection: SortDirection;
};

type CursorField = XOR<string, AliasedField>;

interface AliasedField {
  alias: string;
  column: string;
}

type PaginationSliceParams = XOR<
  ForwardPaginationSliceParams,
  BackwardPaginationSliceParams
>;

interface ForwardPaginationSliceParams {
  first: number;
  after?: Cursor;
}

interface BackwardPaginationSliceParams {
  last: number;
  before?: Cursor;
}

interface InternalSliceParams {
  direction: PaginationDirection;
  limit: number;
  cursor?: Cursor;
}

type PaginationDirection = 'forward' | 'backward';

export interface Predicate {
  orderBy: OrderBy;
  limit: number;
  where: Where;
}

export type Cursor = Knex.Value;

export type OrderBy = {
  column: string;
  direction: SortDirection;
};

export type SortDirection = 'asc' | 'desc';

export interface Where {
  column: string;
  comparator: Comparator;
  value: (b: Knex.QueryBuilder) => Knex.QueryBuilder;
}

export interface NoopWhere {
  column: (q: Knex.QueryBuilder) => Knex.QueryBuilder,
  comparator: '>',
  value: 0
}

export function createPagination(params: PaginationParams) {
  const {
    first,
    after,
    last,
    before,
  } = params;

  const paginationSliceParams = getInternalSliceParams({ first, after, last, before } as PaginationSliceParams);

  const comparator = getComparator(params.sortDirection, paginationSliceParams.direction);
  const sortDirection = getSortDirection(params.sortDirection, paginationSliceParams.direction);

  const orderBy: OrderBy = {
    column: params.sortField,
    direction: sortDirection,
  };
  const returnableLimit = paginationSliceParams.limit;
  const queryableLimit = paginationSliceParams.limit + 1;

  const where = ((): Where => {
    if (paginationSliceParams.cursor === undefined) {
      // this is a noop where-clause value that can
      // be passed to knex .where in same way as the
      // non-noop where-clause value and still work
      return {
        column: (q: Knex.QueryBuilder) => q,
        comparator: '>',
        value: 0
      } as unknown as Where;
    }

    const cursorColumn = getCursorColumn(params.cursorField);
    const subquery = (q: Knex.QueryBuilder): any => q
      .from(params.from)
      .select(params.sortField)
      .where(cursorColumn, '=', paginationSliceParams.cursor as Knex.Value);

    return {
      column: params.sortField,
      comparator: comparator,
      value: subquery,
    };
  })();

  const predicate: Predicate = {
    orderBy,
    limit: queryableLimit,
    where
  };

  const getRows = (rows: unknown[]) => {
    if (rows.length === 0) {
      return [];
    }

    if (rows.length <= returnableLimit) {
      return rows;
    }

    if (rows.length === queryableLimit) {
      const returnableItems = [...rows];

      if (paginationSliceParams.direction === 'forward'){
        returnableItems.pop();
        return returnableItems;
      }

      if (paginationSliceParams.direction === 'backward') {
        returnableItems.shift();
        return returnableItems;
      }
    }

    throw new Error('invalid state for getRows');
  };

  return {
    ...predicate,
    getRows,
  }
}

function getCursorColumn(cursorField: CursorField): string {
  if (typeof cursorField === 'string') {
    return cursorField;
  }
  const aliasedField = cursorField as AliasedField;
  return aliasedField.column;
}

function getInternalSliceParams(sliceParams: PaginationSliceParams): InternalSliceParams {
  if (sliceParams.last) {
    return {
      direction: 'backward',
      cursor: sliceParams.before,
      limit: sliceParams.last,
    };
  }

  const forwardSliceParams = sliceParams as ForwardPaginationSliceParams;
  return {
    direction: 'forward',
    cursor: forwardSliceParams.after,
    limit: forwardSliceParams.first,
  };
}

function getSortDirection(specifiedSortDirection: SortDirection, paginationDirection: PaginationDirection) {
  if (paginationDirection === 'forward') {
    return specifiedSortDirection;
  }

  if (specifiedSortDirection === 'desc') {
    return 'asc';
  }

  if (specifiedSortDirection === 'asc') {
    return 'desc';
  }

  throw new Error('unknown state for getSortDirection');
}

type Comparator = '<' | '>';

function getComparator(specifiedSortDirection: SortDirection, paginationDirection: PaginationDirection): Comparator {
  if (specifiedSortDirection === 'desc') {
    if (paginationDirection === 'forward') {
      return '<';
    }
    if (paginationDirection === 'backward') {
      return '>';
    }
  }

  if (specifiedSortDirection === 'asc') {
    if (paginationDirection === 'forward') {
      return '>'
    }
    if (paginationDirection === 'backward') {
      return '<';
    }
  }

  throw new Error('unknown state for getComparator');
}
