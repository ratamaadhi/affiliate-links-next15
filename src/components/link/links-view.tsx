'use client';

import React from 'react';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ErrorState } from '@/components/ui/loading-states';
import { Skeleton } from '@/components/ui/skeleton';
import { useLinkForPageInfinite } from '@/hooks/queries';
import { page } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { LinkIcon } from 'lucide-react';
import { Button } from '../ui/button';

export function LinksView({
  pageData,
}: {
  pageData: typeof page.$inferSelect | null;
}) {
  const { data, isLoading, error, mutate } = useLinkForPageInfinite({
    pageId: pageData?.id || null,
  });

  const links = React.useMemo(() => {
    const allLinks = data ? data.flatMap((page) => page?.data?.data || []) : [];
    const uniqueLinks = [];
    const seenIds = new Set();
    for (const link of allLinks) {
      if (link.id && !seenIds.has(link.id)) {
        seenIds.add(link.id);
        uniqueLinks.push(link);
      }
    }
    return uniqueLinks;
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="relative flex-1 h-full w-full max-w-md mx-auto overflow-hidden border-muted-foreground/30 sm:rounded-[34px] sm:border-4 rounded-none sm:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] sm:border-muted-foreground/30 border-0 shadow-none">
          <main className="relative h-full w-full flex flex-col bg-gradient-to-t from-accent to-background sm:px-3.5 px-2">
            <div className="flex flex-col items-center pt-8 pb-4 text-center border-b border-border">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-4 w-48 rounded mt-1" />
            </div>
            <div
              className="flex flex-col gap-3 flex-1 overflow-y-scroll no-scrollbar pt-6 pb-8 px-1 min-h-0"
              data-testid="skeleton-loader"
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 w-full h-16"
                >
                  <Skeleton className="flex-1 h-16 rounded-xl" />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="relative flex-1 h-full w-full max-w-md mx-auto overflow-hidden border-muted-foreground/30 sm:rounded-[34px] sm:border-4 rounded-none sm:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] sm:border-muted-foreground/30 border-0 shadow-none">
          <main className="relative h-full w-full flex flex-col bg-gradient-to-t from-accent to-background sm:px-3.5 px-2">
            <div className="flex flex-col justify-center items-center text-center gap-3.5 flex-1 overflow-y-scroll no-scrollbar py-8 min-h-0">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.468-.884-6.08-2.33m-.708 3.565C7.246 17.116 9.5 18 12 18s4.754-.884 6.58-2.33m.708-3.565C18.468 10.884 16.34 10 14 10H8m6 2v4m0-6V6"
                  />
                </svg>
              </div>
              <p className="font-semibold text-lg">No Page Selected or Found</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Select a page to see its preview.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-full flex flex-col">
        <div className="relative flex-1 h-full w-full max-w-md mx-auto overflow-hidden border-muted-foreground/30 sm:rounded-[34px] sm:border-4 rounded-none sm:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] sm:border-muted-foreground/30 border-0 shadow-none">
          {/* real page content  */}
          <main className="relative h-full w-full sm:px-3.5 px-2 flex flex-col bg-gradient-to-t from-accent to-background overflow-y-scroll no-scrollbar min-h-0">
            <div className="flex flex-col items-center pt-8 pb-4 text-center border-b border-border">
              <h1 className="font-bold text-xl w-full line-clamp-1 text-foreground">
                {pageData.title}
              </h1>
              {pageData.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {pageData.description}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 flex-1 pt-6 pb-8 px-1">
              {error ? (
                <ErrorState
                  title="Failed to load links"
                  description="There was an error loading the links. Please try again."
                  onRetry={() => mutate()}
                />
              ) : links && links.filter((link) => link.isActive).length > 0 ? (
                links.map((link) => (
                  <Button
                    key={link.id}
                    variant="secondary"
                    className={cn(
                      'relative w-full h-16 sm:h-16 text-base sm:text-base rounded-xl bg-background/80 hover:bg-background transition-colors py-2 shadow-sm hover:shadow-md border border-border/50 hover:border-border',
                      link.imageUrl ? 'sm:px-16 px-15' : 'px-4'
                    )}
                    asChild
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full"
                    >
                      {link.imageUrl && (
                        <div className="flex-shrink-0 w-12 h-12 sm:w-12 sm:h-12 absolute left-2 top-1/2 -translate-y-1/2">
                          <img
                            src={link.imageUrl}
                            alt={link.title.replace(/\s+\d+.*$/, '').trim()}
                            className="object-cover rounded-md w-full h-full border border-border shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="w-full line-clamp-2 text-center text-sm leading-tight whitespace-normal break-words font-medium text-foreground">
                        {link.title.replace(/\s+\d+.*$/, '').trim()}
                      </div>
                    </a>
                  </Button>
                ))
              ) : (
                <div className="text-center py-8 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <LinkIcon />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    No active links to display.
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Add some links to get started!
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
