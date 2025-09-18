'use client';

import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useLinkForPageInfinite } from '@/hooks/queries';
import { page } from '@/lib/db/schema';
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
            <div className="flex flex-col gap-3.5 flex-1 overflow-y-scroll no-scrollbar py-8 min-h-0">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="w-full h-14 rounded-xl" />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!page) {
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
        <main className="relative h-full w-full px-3.5 flex flex-col bg-gradient-to-t from-accent to-background">
          <div className="flex flex-col items-center pt-8 pb-4 bg-background text-center">
            <p className="font-semibold text-xl w-full line-clamp-1">
              {pageData.title}
            </p>
            <p>{pageData.description}</p>
          </div>
          <div className="flex flex-col gap-3.5 flex-1 overflow-y-scroll no-scrollbar pt-4 pb-8 min-h-0">
            {links && links.length > 0 ? (
              links
                .filter((link) => link.isActive)
                .map((link) => (
                  <Button
                    key={link.id}
                    variant="outline"
                    className="w-full h-16 text-base rounded-xl bg-muted"
                    asChild
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="w-full truncate text-center text-sm">
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
