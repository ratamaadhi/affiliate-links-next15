import { getPages, PaginationParams } from '@/server/pages';
import useSWR from 'swr';

export function usePages(params: PaginationParams = { page: 1, limit: 5 }) {
  const { page, limit = 5 } = params;

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    `/pages?_page=${page}&_limit=${limit}`,
    () => getPages({ page, limit })
  );

  return {
    data: data?.data,
    isLoading,
    isError: error,
    mutate,
    isValidating,
  };
}
