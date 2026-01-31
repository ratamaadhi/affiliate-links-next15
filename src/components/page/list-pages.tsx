'use client';

import {
  LinkPageContext,
  LinkPageDispatchContext,
} from '@/context/link-page-context';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useContext, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Item, ItemGroup } from '@/components/ui/item';
import { DeletePageButton } from './delete-page-button';
import { EditPageButton } from './edit-page-button';
import { ViewShortUrlsButton } from '../short-urls/view-short-urls-button';
import { ViewShortUrlsDialog } from '../short-urls/view-short-urls-dialog';
import { ViewShortUrlsDrawer } from '../short-urls/view-short-urls-drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import type { PageSelect } from '@/lib/db/schema';

interface ListPagesProps {
  defaultPageSlug: string;
  pages: PageSelect[];
  hasMore: boolean;
  isLoading: boolean;
  loaderRef: (node?: Element | null) => void;
}

export const ListPages = ({
  defaultPageSlug,
  pages,
  hasMore,
  isLoading,
  loaderRef,
}: ListPagesProps) => {
  const { selectedPage } = useContext(LinkPageContext);
  const dispatch = useContext(LinkPageDispatchContext);

  const [viewShortUrlsOpen, setViewShortUrlsOpen] = useState(false);
  const [selectedPageForView, setSelectedPageForView] = useState<{
    id: number;
    slug: string;
  } | null>(null);
  const isMobile = useIsMobile();

  const { user } = useAuth();

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
      {/* Pages List */}
      <div className="min-h-[300px] mb-3">
        {!isLoading && pages.length === 0 && (
          <p className="text-sm text-muted-foreground">No pages found.</p>
        )}
        {!isLoading && pages.length > 0 && (
          <ItemGroup className="space-y-3">
            {pages.map((page) => (
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
        {isLoading && pages.length === 0 && (
          <ItemGroup className="space-y-3">
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

      {/* Infinite Scroll Loader */}
      {hasMore && (
        <div ref={loaderRef} className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* End of List Message */}
      {!hasMore && pages.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-2">
          You&apos;ve reached the end
        </p>
      )}

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
    </div>
  );
};
