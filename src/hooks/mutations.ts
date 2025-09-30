import {
  createLink,
  deleteLink,
  switchIsActiveLink,
  updateLink,
  updateLinkOrder,
} from '@/server/links';
import {
  createPage,
  deletePage,
  PaginationParams,
  updatePage,
} from '@/server/pages';
import { toast } from 'sonner';
import useSWRmutation from 'swr/mutation';
import { useLinkInfinite, usePages } from './queries';

export function useCreatePage(
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) {
  const { page, limit = 5, search } = params;
  const { mutate } = usePages({ page, limit, search });

  return useSWRmutation('/pages', createPage, {
    onSuccess: () => {
      mutate();
      toast.success('Page created successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to create page';
      toast.error(message);
    },
  });
}

export function useUpdatePage(
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) {
  const { page, limit = 5, search } = params;
  const { mutate } = usePages({ page, limit, search });

  return useSWRmutation('/pages', updatePage, {
    onSuccess: () => {
      mutate();
      toast.success('Page updated successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to update page';
      toast.error(message);
    },
  });
}

export function useDeletePage(
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) {
  const { page, limit = 5, search } = params;
  const { mutate } = usePages({ page, limit, search });

  return useSWRmutation('/pages', deletePage, {
    onSuccess: () => {
      mutate();
      toast.success('Page deleted successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to delete page';
      toast.error(message);
    },
  });
}

export function useCreateLink(
  params: PaginationParams & { pageId: number } = {
    page: 1,
    limit: 5,
    search: '',
    pageId: null,
  }
) {
  const { limit = 5, search, pageId } = params;
  const { mutate } = useLinkInfinite({ limit, search, pageId });

  return useSWRmutation('/links', createLink, {
    onSuccess: () => {
      mutate();
      toast.success('Link created successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to create link';
      toast.error(message);
    },
  });
}

export function useSwitchIsActive(
  params: PaginationParams & { pageId: number } = {
    page: 1,
    limit: 5,
    search: '',
    pageId: null,
  }
) {
  const { limit = 5, search, pageId } = params;
  const { mutate } = useLinkInfinite({ limit, search, pageId });

  return useSWRmutation('/links', switchIsActiveLink, {
    onSuccess: () => {
      mutate();
      toast.success('Link updated successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to update link';
      toast.error(message);
    },
  });
}

export function useDeleteLink(
  params: PaginationParams & { pageId: number } = {
    page: 1,
    limit: 5,
    search: '',
    pageId: null,
  }
) {
  const { limit = 5, search, pageId } = params;
  const { mutate } = useLinkInfinite({ limit, search, pageId });

  return useSWRmutation('/links', deleteLink, {
    onSuccess: () => {
      mutate();
      toast.success('Link deleted successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to delete link';
      toast.error(message);
    },
  });
}

export function useUpdateLinkOrder(
  params: PaginationParams & { pageId: number } = {
    page: 1,
    limit: 5,
    search: '',
    pageId: null,
  }
) {
  const { limit = 5, search, pageId } = params;
  const { mutate } = useLinkInfinite({ limit, search, pageId });

  return useSWRmutation('/links', updateLinkOrder, {
    onSuccess: () => {
      mutate();
      toast.success('Link order updated successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to update link order';
      toast.error(message);
    },
    revalidate: true,
  });
}

export function useUpdateLink(
  params: PaginationParams & { pageId: number } = {
    page: 1,
    limit: 5,
    search: '',
    pageId: null,
  }
) {
  const { limit = 5, search, pageId } = params;
  const { mutate } = useLinkInfinite({ limit, search, pageId });

  return useSWRmutation('/links', updateLink, {
    onSuccess: () => {
      mutate();
      toast.success('Link updated successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to update link';
      toast.error(message);
    },
    revalidate: true,
  });
}
