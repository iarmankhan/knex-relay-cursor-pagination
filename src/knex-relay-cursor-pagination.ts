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
    first,
    after,
    last,
    before,
  } = params;

  const paginationSliceParams = getInternalSliceParams({ first, after, last, before } as PaginationSliceParams);

  const comparator = getComparator(params.sortDirection, paginationSliceParams.direction);
  const sortDirection = getSortDirection(params.sortDirection, paginationSliceParams.direction);

  const orderBy: OrderBy = [params.sortField, sortDirection];
  const returnableLimit = paginationSliceParams.limit;
  const queryableLimit = paginationSliceParams.limit + 1;

  const where = ((): Where => {
    if (paginationSliceParams.cursor === undefined) {
      return [true];
    }

    return [
      params.sortField,
      comparator,
      subquery => subquery
        .from(params.table)
        .select(params.sortField)
        .where(params.cursorField, '=', paginationSliceParams.cursor)
    ];
  })();

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
