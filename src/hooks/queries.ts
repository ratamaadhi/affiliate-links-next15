import { getPages, PaginationParams } from '@/server/pages';
import useSWR from 'swr';

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
