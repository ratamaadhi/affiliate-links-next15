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
import { useLinkInfinite, usePages, useUserShortLinks } from './queries';

export interface UpdateUsernameParams {
  username: string;
}

export async function updateUsername(
  _url: string,
  { arg }: { arg: UpdateUsernameParams }
) {
  const res = await fetch('/api/user/update-username', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(
      error.message || error.error || 'Failed to update username'
    );
  }

  const response = await res.json();
  return response;
}

export async function generateShortLink(
  _url: string,
  { arg }: { arg: { pageId: number } }
) {
  const res = await fetch('/api/short-links/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(
      error.message || error.error || 'Failed to generate short link'
    );
  }

  const response = await res.json();
  return response.data;
}

export async function deleteShortLink(
  _url: string,
  { arg }: { arg: { id: number } }
) {
  const res = await fetch(`/api/short-links/${arg.id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(
      error.message || error.error || 'Failed to delete short link'
    );
  }

  return { success: true };
}

export function useCreatePage(
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) {
  const { page, limit = 5, search } = params;
  const { mutate } = usePages({ page, limit, search });

  return useSWRmutation('/pages', createPage, {
    onSuccess: () => {
      mutate();
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
  });
}

export function useUpdateUsername() {
  return useSWRmutation('/username', updateUsername, {
    onSuccess: () => {
      toast.success('Username updated successfully');
      window.location.href = '/dashboard/settings';
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to update username';
      toast.error(message);
    },
  });
}

export function useGenerateShortLink(pageId?: number) {
  const { mutate } = useUserShortLinks(pageId);

  return useSWRmutation('/short-links', generateShortLink, {
    onSuccess: () => {
      mutate();
      toast.success('Short link generated successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate short link';
      toast.error(message);
    },
  });
}

export function useDeleteShortLink(pageId?: number) {
  const { mutate } = useUserShortLinks(pageId);

  return useSWRmutation('/short-links', deleteShortLink, {
    onSuccess: () => {
      mutate();
      toast.success('Short link deleted successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to delete short link';
      toast.error(message);
    },
  });
}
