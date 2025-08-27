import {
  createPage,
  deletePage,
  PaginationParams,
  updatePage,
} from '@/server/pages';
import { toast } from 'sonner';
import useSWRmutation from 'swr/mutation';
import { usePages } from './queries';

export function useCreatePage(
  params: PaginationParams = { page: 1, limit: 5 }
) {
  const { page, limit = 5 } = params;
  const { mutate } = usePages({ page, limit });

  return useSWRmutation('/pages', createPage, {
    onSuccess: () => {
      mutate();
      toast.success('Pgae created successfully');
    },
    onError: () => {
      toast.error('Failed to create page');
    },
  });
}

export function useUpdatePage(
  params: PaginationParams = { page: 1, limit: 5 }
) {
  const { page, limit = 5 } = params;
  const { mutate } = usePages({ page, limit });

  return useSWRmutation('/pages', updatePage, {
    onSuccess: () => {
      mutate();
      toast.success('Page updated successfully');
    },
    onError: () => {
      toast.error('Failed to update page');
    },
  });
}

export function useDeletePage(
  params: PaginationParams = { page: 1, limit: 5 }
) {
  const { page, limit = 5 } = params;
  const { mutate } = usePages({ page, limit });

  return useSWRmutation('/pages', deletePage, {
    onSuccess: () => {
      mutate();
      toast.success('Page deleted successfully');
    },
    onError: () => {
      toast.error('Failed to deleted page');
    },
  });
}
