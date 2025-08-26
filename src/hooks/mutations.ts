import { createPage, deletePage, updatePage } from '@/server/pages';
import { toast } from 'sonner';
import useSWRmutation from 'swr/mutation';
import { usePages } from './queries';

export function useCreatePage() {
  const { mutate } = usePages();

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

export function useUpdatePage() {
  const { mutate } = usePages();

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

export function useDeletePage() {
  const { mutate } = usePages();

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
