import { Knex } from 'knex';

import { XOR } from './util';

export type PaginationParams =
  PaginationSliceParams & {
  cursorField: string;
  sortField: string;
  sortDirection: string;
};

type PaginationSliceParams = XOR<{
  first: number;
  after: Cursor;
}, {
  last: number;
  before: Cursor;
}>;

export interface Predicate {
  orderBy: OrderBy;
  limit: number;
  where: Where;
}

export type Cursor = Knex.Value;

export type OrderBy = [string, SortDirection];

export type SortDirection = 'asc' | 'desc';

export type Where = [string, string, Cursor];

export function createPagination(params: PaginationParams) {
  
}
