import { getLinks } from '@/server/links';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

const PAGE_SIZE = 5;

function validateApiResponse(response: any) {
  const responseData = response?.data.data;
  const pagination = response?.data.pagination;

  if (!responseData || !pagination) {
    return { valid: false, responseData: null, pagination: null };
  }
  return { valid: true, responseData, pagination };
}

interface UpdateLinksStateArgs {
  setLinks: React.Dispatch<React.SetStateAction<any[]>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  newLinks: any[];
  totalItems: number;
  currentPage: number;
  isFirstPage: boolean;
}

function updateLinksState({
  setLinks,
  setHasMore,
  setPage,
  newLinks,
  totalItems,
  currentPage,
  isFirstPage,
}: UpdateLinksStateArgs) {
  setLinks((prevPosts) => {
    const updatedLinks = isFirstPage ? newLinks : [...prevPosts, ...newLinks];

    const uniqueLinks = Array.from(
      new Map(updatedLinks.map((link) => [link.id, link])).values()
    );

    setHasMore(uniqueLinks.length < totalItems);
    setPage(currentPage);

    return uniqueLinks;
  });
}

function useLinksInfinite({ pageId = null }) {
  const [links, setLinks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLinks = useCallback(
    async (pageNumber: number, keyword: string = '') => {
      try {
        setIsLoading(true);
        const response = await getLinks({
          page: pageNumber,
          search: keyword,
          limit: PAGE_SIZE,
          pageId: pageId,
        });

        const { valid, responseData, pagination } =
          validateApiResponse(response);

        if (!valid) {
          setHasMore(false);
          return;
        }

        updateLinksState({
          setLinks,
          setHasMore,
          setPage,
          newLinks: responseData,
          totalItems: pagination.totalItems,
          currentPage: pagination.currentPage,
          isFirstPage: pageNumber === 1,
        });
      } catch (error) {
        console.error('Failed to load Links:', error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [setHasMore, setPage, setLinks]
  );

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (pageId) {
      setPage(1);
      setHasMore(true);
      setLinks([]);
      fetchLinks(1, debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, fetchLinks, pageId]);

  return {
    data: links,
    hasMore,
    page,
    handleSearch,
    isLoading,
    setIsLoading,
    fetchLinks,
    debouncedSearchTerm,
  };
}

export default useLinksInfinite;
