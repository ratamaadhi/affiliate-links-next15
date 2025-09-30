'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkPageContext } from '@/context/link-page-context';
import { useContext, useEffect, useState } from 'react';

export function EnhancedDashboardPreview({
  pageLink,
  username,
}: {
  pageLink: string;
  username: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { selectedPage } = useContext(LinkPageContext);

  // Handle case where selectedPage is empty string or undefined
  const slug =
    selectedPage &&
    typeof selectedPage === 'object' &&
    selectedPage.slug === username
      ? ''
      : selectedPage && typeof selectedPage === 'object'
        ? selectedPage.slug
        : '';
  const fullLink = slug ? `${pageLink}/${slug}` : pageLink;

  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully:', fullLink);
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    console.log('Iframe failed to load:', fullLink);
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount((prev) => prev + 1);
  };

  // Add timeout to handle cases where iframe never loads
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          console.log('Iframe loading timeout reached for:', fullLink);
          setIsLoading(false);
          setHasError(true);
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, fullLink]);

  if (!pageLink || !username) {
    return (
      <div className="w-full">
        <div className="relative flex aspect-[9/16] max-h-[120vh] w-[340px] max-w-[394px] origin-top scale-[1] flex-col items-center gap-10 mx-auto">
          <div className="h-full w-full">
            <div className="relative h-full w-full overflow-hidden border-muted-foreground/30 sm:rounded-[34px] sm:border-4 rounded-none sm:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] sm:border-muted-foreground/30 border-0 shadow-none">
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
                  <p className="font-semibold text-lg">
                    No Page Selected or Found
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Select a page to see its preview.
                  </p>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative flex aspect-[9/16] max-h-[120vh] w-[340px] max-w-[394px] origin-top scale-[1] flex-col items-center gap-10 mx-auto">
        <div className="h-full w-full">
          <div className="relative h-full w-full overflow-hidden border-muted-foreground/30 sm:rounded-[34px] sm:border-4 rounded-none sm:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] sm:border-muted-foreground/30 border-0 shadow-none">
            {/* Always render iframe but control visibility */}
            <iframe
              key={`${fullLink}-${retryCount}`}
              className={`w-full h-full border-0 ${isLoading || hasError ? 'invisible absolute' : 'visible relative'}`}
              src={fullLink}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts"
              loading="eager"
              title="preview"
              style={{ display: isLoading || hasError ? 'none' : 'block' }}
            />

            {/* Loading overlay */}
            {isLoading && (
              <main className="absolute inset-0 flex flex-col bg-gradient-to-t from-accent to-background sm:px-3.5 px-2">
                <div className="flex flex-col items-center pt-8 pb-4 text-center border-b border-border">
                  <Skeleton className="h-6 w-32 rounded" />
                  <Skeleton className="h-4 w-48 rounded mt-1" />
                </div>
                <div
                  className="flex flex-col gap-3.5 flex-1 overflow-y-scroll no-scrollbar pt-6 pb-8 px-1 min-h-0"
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
            )}

            {/* Error overlay */}
            {hasError && (
              <main className="absolute inset-0 flex flex-col bg-gradient-to-t from-accent to-background sm:px-3.5 px-2">
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <p className="font-semibold text-lg">
                    Preview Failed to Load
                  </p>
                  <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                    There was an error loading the preview. Please try again.
                  </p>
                  <Button onClick={handleRetry} variant="outline">
                    Retry
                  </Button>
                </div>
              </main>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
