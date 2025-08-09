'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import qs from 'qs';
import { debounce } from 'lodash';

const PAGE_SIZE = 5;

// Custom hook for fetching and managing posts
function usePosts() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = useCallback(async (pageNumber, queryParams = {}) => {
    try {
      const query = qs.stringify(
        {
          populate: '*',
          pagination: {
            page: pageNumber,
            pageSize: PAGE_SIZE,
          },
          filters: queryParams,
        },
        { encodeValuesOnly: true }
      );

      const response = await fetchAPI(`/posts?${query}`);

      if (!response?.data || !response?.meta) {
        console.error('Invalid API response structure:', response);
        setHasMore(false);
        return;
      }

      if (!response.data) {
        console.error('API response missing data:', response);
        setHasMore(false);
        return;
      }

      if (!response.meta) {
        console.error('API response missing meta:', response);
        setHasMore(false);
        return;
      }

      const newPosts = response.data;
      const total = response.meta.pagination.total;
      const isFirstPage = pageNumber === 1;

      setPosts((prevPosts) => {
        const updatedPosts = isFirstPage
          ? newPosts
          : [...prevPosts, ...newPosts];
        setHasMore(updatedPosts.length < total);
        return updatedPosts;
      });
    } catch (error) {
      console.error('Failed to load posts:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPosts = useCallback(
    (pageNumber, keyword = '') => {
      setIsLoading(true);
      const queryParams = keyword
        ? {
            $or: [
              { title: { $containsi: keyword } },
              { description: { $containsi: keyword } },
              { link: { $containsi: keyword } },
            ],
          }
        : undefined;

      return fetchPosts(pageNumber, queryParams);
    },
    [fetchPosts]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadPosts(1, searchTerm);
  }, [searchTerm, loadPosts]);

  useEffect(() => {
    if (page > 1) {
      loadPosts(page, searchTerm);
    }
  }, [page, searchTerm, loadPosts]);

  const debouncedSetSearchTerm = useRef(debounce(setSearchTerm, 300)).current;

  const handleSearch = useCallback(
    (value) => {
      debouncedSetSearchTerm(value);
    },
    [debouncedSetSearchTerm]
  );

  return {
    posts,
    hasMore,
    setPage,
    handleSearch,
    isLoading,
    setIsLoading,
  };
}

export default usePosts;
