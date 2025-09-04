'use client';

import { getPages } from '@/server/pages';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

const PAGE_SIZE = 10;

function validateApiResponse(response: any) {
  const responseData = response?.data.data;
  const pagination = response?.data.pagination;

  if (!responseData || !pagination) {
    return { valid: false, responseData: null, pagination: null };
  }
  return { valid: true, responseData, pagination };
}

interface UpdatePagesStateArgs {
  setPages: React.Dispatch<React.SetStateAction<any[]>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  newPages: any[];
  totalItems: number;
  currentPage: number;
  isFirstPage: boolean;
}

function updatePagesState({
  setPages,
  setHasMore,
  setPage,
  newPages,
  totalItems,
  currentPage,
  isFirstPage,
}: UpdatePagesStateArgs) {
  setPages((prevPosts) => {
    const updatedPages = isFirstPage ? newPages : [...prevPosts, ...newPages];

    const uniquePages = Array.from(
      new Map(updatedPages.map((page) => [page.id, page])).values()
    );

    setHasMore(uniquePages.length < totalItems);
    setPage(currentPage);

    return uniquePages;
  });
}

function usePagesInfinite() {
  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchPages = useCallback(
    async (pageNumber: number, keyword: string = '') => {
      try {
        setIsLoading(true);
        const response = await getPages({
          page: pageNumber,
          limit: PAGE_SIZE,
          search: keyword,
        });
        const { valid, responseData, pagination } =
          validateApiResponse(response);

        if (!valid) {
          setHasMore(false);
          return;
        }

        updatePagesState({
          setPages,
          setHasMore,
          setPage,
          newPages: responseData,
          totalItems: pagination.totalItems,
          currentPage: pagination.currentPage,
          isFirstPage: pageNumber === 1,
        });
      } catch (error) {
        console.error('Failed to load pages:', error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [setPages, setHasMore, setPage]
  );

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setPages([]);
    fetchPages(1, debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchPages]);

  return {
    data: pages,
    hasMore,
    page,
    handleSearch,
    isLoading,
    setIsLoading,
    fetchPages,
    debouncedSearchTerm,
  };
}

export default usePagesInfinite;
