import { getPages, PaginationParams } from '@/server/pages';
import useSWR from 'swr';

export function usePages(params: PaginationParams = { page: 1, limit: 5 }) {
  const { page, limit } = params;

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    `/pages`,
    () => getPages({ page, limit })
  );

  return {
    pages: data?.pages,
    isLoading,
    isError: error,
    mutate,
    isValidating,
  };
}
