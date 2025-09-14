import { getLinks } from '@/server/links';
import { getPageInfinite, getPages, PaginationParams } from '@/server/pages';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

export function usePages(
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) {
  const { page, limit = 5, search } = params;

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    `/pages?_page=${page}&_limit=${limit}&_search=${search}`,
    () => getPages({ page, limit, search })
  );

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate,
    isValidating,
  };
}

export function usePageInfinite(
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) {
  const { page, limit = 10, search } = params;
  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.length) return null; // reached the end
    return `/pages?_page=${pageIndex}&limit=10`; // SWR key
  };
  return useSWRInfinite(getKey, () => getPageInfinite({ page, limit, search }));
}

export function useLinks(
  params: PaginationParams & { pageId: number } = {
    page: 1,
    limit: 5,
    search: '',
    pageId: null,
  }
) {
  const { page, limit = 5, search, pageId } = params;
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    pageId
      ? `/links?_pageid=${pageId}&_page=${page}&_limit=${limit}&_search=${search}`
      : null,
    () => getLinks({ page, limit, search, pageId })
  );

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate,
    isValidating,
  };
}

const getKey = ({ index, previousPageData, pageId, limit, search }) => {
  // The previous page's data is the raw response from the fetcher
  // We need to check the length of the actual data array inside the response
  if (previousPageData && !previousPageData.data.data.length) return null; // reached the end

  return pageId ? { page: index, limit, search, pageId } : null; // SWR key
};

export function useLinkInfinite(
  params: Omit<PaginationParams, 'page'> & { pageId: number } = {
    limit: 5,
    search: '',
    pageId: null,
  }
) {
  const { limit = 5, search = '', pageId } = params;
  return useSWRInfinite(
    (prev, data) =>
      getKey({ index: prev, previousPageData: data, pageId, limit, search }),
    (arg) =>
      getLinks({
        page: arg.page + 1,
        limit: arg.limit,
        search: arg.search,
        pageId: arg.pageId,
      }),
    {
      revalidateAll: true,
    }
  );
}
