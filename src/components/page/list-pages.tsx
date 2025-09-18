'use client';

import { usePages } from '@/hooks/queries';
import { useSearchParams } from 'next/navigation';

import {
  LinkPageContext,
  LinkPageDispatchContext,
} from '@/context/link-page-context';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useContext, useEffect } from 'react';
import { BorderBeam } from '../ui/border-beam';
import PaginationWithLink from '../ui/pagination-with-link';
import { Skeleton } from '../ui/skeleton';
import { DeletePageButton } from './delete-page-button';
import { EditPageButton } from './edit-page-button';

export const ListPages = ({ defaultPageSlug }: { defaultPageSlug: string }) => {
  const { selectedPage } = useContext(LinkPageContext);
  const dispatch = useContext(LinkPageDispatchContext);

  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const search = searchParams.get('_search') ?? '';

  const { data, isLoading } = usePages({ page: pageIndex, search });
  const { user } = useAuth();

  const pages = data?.data || [];
  const pagination = data?.pagination;

  useEffect(() => {
    const shouldSetDefaultValue = !selectedPage && defaultPageSlug;

    if (shouldSetDefaultValue) {
      const defaultValue = pages.find((list) => list.slug === defaultPageSlug);

      if (defaultValue) {
        dispatch({
          type: 'changed',
          payload: defaultValue,
        });
      }
    }
  }, [pages, defaultPageSlug, selectedPage]);

  function handleSelectPage(page) {
    dispatch({
      type: 'changed',
      payload: page,
    });
  }

  return (
    <div>
      <div className="min-h-[342px] mb-3">
        {!isLoading && pages.length === 0 && (
          <p className="text-sm text-muted-foreground">No pages found.</p>
        )}
        {!isLoading && pages.length > 0 && (
          <ul className="space-y-2">
            {pages.map((page) => (
              <li
                key={page.id}
                className={cn(
                  'relative w-full flex gap-x-1 justify-between items-center px-4 py-2 border rounded-md shadow cursor-pointer hover:bg-accent/50 hover:shadow-md',
                  selectedPage?.id === page.id && 'bg-accent/30 shadow-md'
                )}
                onClick={() => handleSelectPage(page)}
              >
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{page.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {page.description || 'No description'}
                  </p>
                </div>
                {user && user.username && user.username !== page.slug && (
                  <div className="space-x-2 flex-shrink-0">
                    <EditPageButton data={page} />
                    <DeletePageButton pageId={page.id} />
                  </div>
                )}
                {selectedPage?.id === page.id && (
                  <>
                    <BorderBeam
                      duration={8}
                      size={80}
                      borderWidth={2}
                      // className="from-transparent via-purple-500 to-transparent"
                    />
                    <BorderBeam
                      duration={8}
                      delay={4}
                      size={80}
                      borderWidth={2}
                      // className="from-transparent via-blue-500 to-transparent"
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="flex justify-between items-center px-4 py-2 border rounded-md shadow gap-2"
                key={index}
              >
                <div className="w-full space-y-3">
                  <Skeleton className="w-1/4 h-4" />
                  <Skeleton className="w-full h-4" />
                </div>
                <div className="space-x-2 flex">
                  <Skeleton className="w-8 h-8" />
                  <Skeleton className="w-8 h-8" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PaginationWithLink pagination={pagination} pageSearchParam="_page" />
    </div>
  );
};
