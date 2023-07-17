import { Knex } from 'knex';

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export type PaginationParams =
  PaginationSliceParams & {
  cursorField: string;
  sortField: string;
  sortDirection: SortDirection;
  table: string;
};

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

export type OrderBy = [string, SortDirection];

export type SortDirection = 'asc' | 'desc';

export type Where = XOR<[string, string, Cursor], [true]>;

export function createPagination(params: PaginationParams) {
  const {
    sortField,
    sortDirection,
    first,
    after,
    last,
    before,
    cursorField,
    table,
  } = params;

  const paginationSliceParams = getInternalSliceParams({ first, after, last, before } as PaginationSliceParams);

  const orderBy: OrderBy = [sortField, sortDirection];
  const comparator = getComparator(paginationSliceParams.direction, sortDirection);

  const returnableLimit = paginationSliceParams.limit;
  const queryableLimit = paginationSliceParams.limit + 1;

  const where = ((): Where => {
    if (paginationSliceParams.cursor === undefined) {
      return [true];
    }

    return [
      sortField,
      comparator,
      subquery => subquery.from(table).select(sortField).where(cursorField, '=', paginationSliceParams.cursor)
    ];
  })();

  console.log(where);

  const predicate: Predicate = {
    orderBy,
    limit: queryableLimit,
    where
  };

  return {
    ...predicate,
  }
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

type Comparator = '<=' | '>=' | '<' | '>';

function getComparator(paginationDirection: PaginationDirection, sortDirection: SortDirection): Comparator {
  if (sortDirection === 'desc') {
    if (paginationDirection === 'forward') {
      return '<';
    }
    if (paginationDirection === 'backward') {
      return '>=';
    }
  }

  if (sortDirection === 'asc') {
    if (paginationDirection === 'forward') {
      return '>='
    }
    if (paginationDirection === 'backward') {
      return '<=';
    }
  }

  throw new Error('unknown comparator state');
}
