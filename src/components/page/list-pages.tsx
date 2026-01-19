'use client';

import { usePages } from '@/hooks/queries';
import { useSearchParams } from 'next/navigation';

import {
  LinkPageContext,
  LinkPageDispatchContext,
} from '@/context/link-page-context';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useContext, useEffect, useMemo, useState } from 'react';
import PaginationWithLink from '../ui/pagination-with-link';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Item, ItemGroup } from '@/components/ui/item';
import { DeletePageButton } from './delete-page-button';
import { EditPageButton } from './edit-page-button';
import { ViewShortUrlsButton } from '../short-urls/view-short-urls-button';
import { ViewShortUrlsDialog } from '../short-urls/view-short-urls-dialog';
import { ViewShortUrlsDrawer } from '../short-urls/view-short-urls-drawer';
import { useIsMobile } from '@/hooks/use-mobile';

export const ListPages = ({ defaultPageSlug }: { defaultPageSlug: string }) => {
  const { selectedPage } = useContext(LinkPageContext);
  const dispatch = useContext(LinkPageDispatchContext);

  const [viewShortUrlsOpen, setViewShortUrlsOpen] = useState(false);
  const [selectedPageForView, setSelectedPageForView] = useState<{
    id: number;
    slug: string;
  } | null>(null);
  const isMobile = useIsMobile();

  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const search = searchParams.get('_search') ?? '';

  const { data, isLoading } = usePages({ page: pageIndex, search });
  const { user } = useAuth();

  const pages = useMemo(() => data?.data || [], [data?.data]);
  const pagination = data?.pagination;

  useEffect(() => {
    const shouldSetDefaultValue = !selectedPage && defaultPageSlug;

    if (shouldSetDefaultValue) {
      const defaultValue = pages.find(
        (pages) => pages.slug === defaultPageSlug
      );

      if (defaultValue) {
        dispatch({
          type: 'changed',
          payload: defaultValue,
        });
      }
    }
  }, [pages, defaultPageSlug, selectedPage, dispatch]);

  function handleSelectPage(page) {
    dispatch({
      type: 'changed',
      payload: page,
    });
  }

  function handleViewShortUrls(pageId: number, pageSlug: string) {
    setSelectedPageForView({ id: pageId, slug: pageSlug });
    setViewShortUrlsOpen(true);
  }

  return (
    <div>
      {/* UPDATED: Reduced min-height */}
      <div className="min-h-[300px] mb-3">
        {!isLoading && pages.length === 0 && (
          <p className="text-sm text-muted-foreground">No pages found.</p>
        )}
        {!isLoading && pages.length > 0 && (
          /* UPDATED: Using ItemGroup instead of ul */
          <ItemGroup className="space-y-1.5">
            {pages.map((page) => (
              /* UPDATED: Using Item instead of li */
              <Item
                key={page.id}
                variant="outline"
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedPage?.id === page.id && 'bg-accent/50 border-accent'
                )}
                onClick={() => handleSelectPage(page)}
              >
                {/* Top Content Area */}
                <div className="w-full flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Title */}
                    <h3 className="font-semibold text-sm mb-1">{page.title}</h3>

                    {/* Slug + Description as Subtitle */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                        {page.slug}
                      </code>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      <span className="text-muted-foreground/75 line-clamp-1">
                        {page.description || 'No description'}
                      </span>
                    </div>
                  </div>

                  {/* Selected Indicator Dot */}
                  {selectedPage?.id === page.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                  )}
                </div>

                {/* Separator Line */}
                <Separator className="" />

                {/* Bottom Actions Area */}
                {user && user.username && (
                  <div className="w-full flex items-center justify-between">
                    <div className="w-full flex items-center justify-end gap-2">
                      <div onMouseDown={(e) => e.stopPropagation()}>
                        <ViewShortUrlsButton
                          pageId={page.id}
                          pageSlug={page.slug}
                          onClick={() =>
                            handleViewShortUrls(page.id, page.slug)
                          }
                        />
                      </div>
                      {/* Wrapper div to prevent event bubbling to Item onClick */}
                      <div onMouseDown={(e) => e.stopPropagation()}>
                        <EditPageButton data={page} />
                      </div>
                      {user.username !== page.slug && (
                        <div onMouseDown={(e) => e.stopPropagation()}>
                          <DeletePageButton data={page} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Item>
            ))}
          </ItemGroup>
        )}
        {isLoading && (
          /* UPDATED: Skeleton with new layout */
          <ItemGroup className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Item key={index} variant="outline">
                {/* Content Area Skeleton */}
                <div className="w-full flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Title Skeleton */}
                    <Skeleton className="h-4 w-1/3 mb-1" />
                    {/* Slug + Description as Subtitle Skeleton */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Skeleton className="h-3 w-16 rounded px-1.5" />
                      <Skeleton className="w-1 h-1 rounded-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                  {/* Selected Indicator Dot Skeleton */}
                  <Skeleton className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" />
                </div>

                {/* Separator */}
                <Separator className="px-4" />

                {/* Bottom Actions Area Skeleton */}
                <div className="w-full flex items-center justify-between">
                  <div className="w-full flex items-center justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </Item>
            ))}
          </ItemGroup>
        )}
      </div>

      {viewShortUrlsOpen &&
        selectedPageForView &&
        (isMobile ? (
          <ViewShortUrlsDrawer
            pageId={selectedPageForView.id}
            pageSlug={selectedPageForView.slug}
            open={viewShortUrlsOpen}
            onOpenChange={setViewShortUrlsOpen}
          />
        ) : (
          <ViewShortUrlsDialog
            pageId={selectedPageForView.id}
            pageSlug={selectedPageForView.slug}
            open={viewShortUrlsOpen}
            onOpenChange={setViewShortUrlsOpen}
          />
        ))}

      <PaginationWithLink pagination={pagination} pageSearchParam="_page" />
    </div>
  );
};
