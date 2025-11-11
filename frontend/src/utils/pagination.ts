import type { PaginatedResponse, PaginationLinks, PaginationMeta } from '@/types/library';

export type LaravelPaginator<T> = {
  data: T[];
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
  first_page_url: string | null;
  last_page_url: string | null;
  next_page_url: string | null;
  prev_page_url: string | null;
};

export function normalizePaginator<T>(
  payload: PaginatedResponse<T> | LaravelPaginator<T>
): PaginatedResponse<T> {
  if ('meta' in payload && payload.meta) {
    return payload as PaginatedResponse<T>;
  }

  const laravelPayload = payload as LaravelPaginator<T>;

  const meta: PaginationMeta = {
    current_page: laravelPayload.current_page,
    from: laravelPayload.from,
    last_page: laravelPayload.last_page,
    path: laravelPayload.path,
    per_page: laravelPayload.per_page,
    to: laravelPayload.to,
    total: laravelPayload.total,
  };

  const links: PaginationLinks = {
    first: laravelPayload.first_page_url,
    last: laravelPayload.last_page_url,
    prev: laravelPayload.prev_page_url,
    next: laravelPayload.next_page_url,
  };

  return {
    data: laravelPayload.data,
    meta,
    links,
  };
}
