'use client';

import { getPages } from '@/server/pages';
import { useCallback, useEffect, useRef, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { useDebounce } from './useDebounce';

const PAGE_SIZE = 10;

const getPagesKey = (index: number, previousPageData: any, search: string) => {
  // Reached the end - check the actual data array inside the response
  if (previousPageData && !previousPageData?.data?.data?.length) {
    return null;
  }

  // Return an object key (like useLinkInfinite) for proper cache key handling
  return {
    page: index + 1,
    limit: PAGE_SIZE,
    search: search || '',
    key: 'pages',
  };
};

function usePagesInfinite() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const prevSearchTerm = useRef(debouncedSearchTerm);

  const { data, isLoading, isValidating, mutate, size, setSize } =
    useSWRInfinite(
      (index, previousPageData) =>
        getPagesKey(index, previousPageData, debouncedSearchTerm),
      (arg) => {
        return getPages({
          page: arg.page,
          limit: arg.limit,
          search: arg.search,
        });
      },
      {
        revalidateAll: true,
        revalidateOnFocus: false,
        dedupingInterval: 1000,
      }
    );

  // Flatten the paginated data
  const pages = data?.flatMap((page) => page?.data?.data || []) || [];

  // Check if there's more data using pagination metadata from API response
  const lastPage = data?.[data.length - 1];
  const hasMore =
    lastPage?.data?.pagination &&
    lastPage.data.pagination.currentPage < lastPage.data.pagination.totalPages;

  // Current page number (size is the number of pages loaded)
  const page = size;

  // Reset to first page when debounced search term changes
  useEffect(() => {
    if (prevSearchTerm.current !== debouncedSearchTerm) {
      prevSearchTerm.current = debouncedSearchTerm;
      setSize(1);
    }
  }, [debouncedSearchTerm, setSize]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Fetch more pages
  const fetchPages = useCallback(
    (pageNumber: number, keyword: string = '') => {
      if (keyword !== debouncedSearchTerm) {
        setSearchTerm(keyword);
        setSize(1);
      } else {
        setSize(pageNumber);
      }
    },
    [debouncedSearchTerm, setSize]
  );

  return {
    data: pages,
    hasMore,
    page,
    handleSearch,
    isLoading,
    isValidating,
    fetchPages,
    debouncedSearchTerm,
    mutate,
  };
}

export default usePagesInfinite;
