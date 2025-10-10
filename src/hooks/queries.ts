import { getLinks, getLinksForPage } from '@/server/links';
import { getPageInfinite, getPages, PaginationParams } from '@/server/pages';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

export function usePages(
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) {
  const { page, limit = 5, search } = params;

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    `/pages?_page=${page}&_limit=${limit}&_search=${search}`,
    () => getPages({ page, limit, search }),
    {
      onError: (error) => {
        console.error('Error fetching pages:', error);
      },
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
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
    () => getLinks({ page, limit, search, pageId }),
    {
      onError: (error) => {
        console.error('Error fetching links:', error);
      },
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate,
    isValidating,
  };
}

const getKey = ({ index, previousPageData, pageId, limit, search, key }) => {
  // The previous page's data is the raw response from the fetcher
  // We need to check the length of the actual data array inside the response
  if (previousPageData && !previousPageData.data.data.length) return null; // reached the end

  // Return a stable key that includes search term for proper caching
  // When search changes, this creates a new cache key without re-fetching all pages
  return pageId
    ? {
        page: index,
        limit,
        search: search || '', // Ensure search is always a string
        pageId,
        key,
      }
    : null;
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
      getKey({
        index: prev,
        previousPageData: data,
        pageId,
        limit,
        search,
        key: 'links',
      }),
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

export function useLinkForPageInfinite(
  params: Omit<PaginationParams, 'page'> & { pageId: number } = {
    limit: 100,
    search: '',
    pageId: null,
  }
) {
  const { limit = 100, search = '', pageId } = params;
  return useSWRInfinite(
    (prev, data) =>
      getKey({
        index: prev,
        previousPageData: data,
        pageId,
        limit,
        search,
        key: 'forPage',
      }),
    (arg) =>
      getLinksForPage({
        page: arg.page + 1,
        limit: arg.limit,
        search: arg.search,
        pageId: arg.pageId,
      }),
    {
      revalidateAll: false, // Prevent re-fetching all pages when search changes
      revalidateFirstPage: false, // Prevent re-fetching first page when search changes
      onError: (error) => {
        console.error('Error fetching links for page:', error);
      },
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      // Optimize for search performance
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000, // Prevent duplicate requests within 1 second
    }
  );
}
