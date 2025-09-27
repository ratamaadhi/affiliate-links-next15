'use client';

import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useLinkForPageInfinite } from '@/hooks/queries';
import { page } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

export function LinksView({
  pageData,
}: {
  pageData: typeof page.$inferSelect | null;
}) {
  const { data, isLoading } = useLinkForPageInfinite({
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
        <div className="relative flex-1 h-full w-full max-w-md md:overflow-hidden md:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] md:rounded-t-[34px] md:border-t-4 md:border-x-4 md:border-muted-foreground/30 md:mx-auto">
          <main className="relative h-full w-full px-3.5 flex flex-col bg-gradient-to-t from-accent to-background">
            <div
              className="flex flex-col gap-3.5 flex-1 overflow-y-scroll no-scrollbar pt-[112px] py-8 min-h-0"
              data-testid="skeleton-loader"
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 w-full h-16"
                >
                  {/* <Skeleton className="w-8 h-8 rounded-md flex-shrink-0" /> */}
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
        <div className="relative flex-1 h-full w-full max-w-md md:overflow-hidden md:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] md:rounded-t-[34px] md:border-t-4 md:border-x-4 md:border-muted-foreground/30 md:mx-auto">
          <main className="relative h-full w-full px-3.5 flex flex-col bg-gradient-to-t from-accent to-background">
            <div className="flex flex-col justify-center items-center text-center gap-3.5 flex-1 overflow-y-scroll no-scrollbar py-8 min-h-0">
              <p className="font-semibold">No Page Selected or Found</p>
              <p className="text-sm text-muted-foreground">
                Select a page to see its preview.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative flex-1 h-full w-full max-w-md md:overflow-hidden md:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] md:rounded-t-[34px] md:border-t-4 md:border-x-4 md:border-muted-foreground/30 md:mx-auto">
        {/* real page content  */}
        <main className="relative h-full w-full px-3.5 flex flex-col bg-gradient-to-t from-accent to-background overflow-y-scroll no-scrollbar min-h-0">
          <div className="flex flex-col items-center pt-8 pb-4 bg-background text-center">
            <p className="font-semibold text-xl w-full line-clamp-1">
              {pageData.title}
            </p>
            <p>{pageData.description}</p>
          </div>
          <div className="flex flex-col gap-3.5 flex-1 pt-4 pb-8">
            {links && links.filter((link) => link.isActive).length > 0 ? (
              links.map((link) => (
                <Button
                  key={link.id}
                  variant="secondary"
                  className={cn(
                    'relative w-full h-16 text-base rounded-xl bg-muted py-2',
                    link.imageUrl ? 'px-17' : 'px-10'
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
                      <div className="flex-shrink-0 w-12 h-12 absolute left-2 top-1/2 -translate-y-1/2">
                        <img
                          src={link.imageUrl}
                          alt={link.title}
                          className="object-cover rounded-md w-full h-full"
                          // onError={(e) => {
                          //   e.currentTarget.style.display = 'none';
                          // }}
                        />
                      </div>
                    )}
                    <div className="w-full line-clamp-2 text-center text-sm leading-tight whitespace-normal break-words">
                      {link.title}
                    </div>
                  </a>
                </Button>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No active links to display.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
