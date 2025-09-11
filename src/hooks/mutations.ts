import {
  createLink,
  deleteLink,
  switchIsActiveLink,
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
import { useLinks, usePages } from './queries';

export function useCreatePage(
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) {
  const { page, limit = 5, search } = params;
  const { mutate } = usePages({ page, limit, search });

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
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) {
  const { page, limit = 5, search } = params;
  const { mutate } = usePages({ page, limit, search });

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
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) {
  const { page, limit = 5, search } = params;
  const { mutate } = usePages({ page, limit, search });

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

export function useCreateLink(
  params: PaginationParams & { pageId: number } = {
    page: 1,
    limit: 5,
    search: '',
    pageId: null,
  }
) {
  const { page, limit = 5, search, pageId } = params;
  const { mutate } = useLinks({ page, limit, search, pageId });

  return useSWRmutation('/links', createLink, {
    onSuccess: () => {
      mutate();
      toast.success('Link created successfully');
    },
    onError: () => {
      toast.error('Failed to create link');
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
  const { page, limit = 5, search, pageId } = params;
  const { mutate } = useLinks({ page, limit, search, pageId });

  return useSWRmutation('/links', switchIsActiveLink, {
    onSuccess: () => {
      mutate();
      toast.success('Link updated successfully');
    },
    onError: () => {
      toast.error('Failed to update link');
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
  const { page, limit = 5, search, pageId } = params;
  const { mutate } = useLinks({ page, limit, search, pageId });

  return useSWRmutation('/links', deleteLink, {
    onSuccess: () => {
      mutate();
      toast.success('Page deleted successfully');
    },
    onError: () => {
      toast.error('Failed to deleted page');
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
  const { page, limit = 5, search, pageId } = params;
  const { mutate } = useLinks({ page, limit, search, pageId });

  return useSWRmutation('/links', updateLinkOrder, {
    onSuccess: () => {
      mutate();
      toast.success('Link order updated successfully');
    },
    onError: () => {
      toast.error('Failed to update link order');
    },
  });
}
