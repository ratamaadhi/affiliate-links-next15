'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkPageContext } from '@/context/link-page-context';
import { useContext, useEffect, useState } from 'react';

import { AlertTriangle, FileQuestion } from 'lucide-react';

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
  const { selectedPage, reloadSignal } = useContext(LinkPageContext);

  // Validate username exists to prevent redirect loops
  const isValidUsername =
    username && username.length > 0 && username !== 'undefined';
  const isValidPageLink = pageLink && !pageLink.includes('undefined');

  // Extract page slug properly from selectedPage
  // selectedPage.slug can be like "username/pagename-randomid" or "pagename-randomid"
  // We only want the pagename-randomid part (without username prefix)
  let slug = '';
  if (selectedPage?.slug) {
    // If slug contains "/" it means it's in "username/slug" format
    const parts = selectedPage.slug.split('/');
    slug = parts.length > 1 ? parts[1] : parts[0];

    // Don't include slug if it's the same as username (user's default page)
    if (slug === username) {
      slug = '';
    }
  }

  // Construct full link safely
  // Only append slug if it exists and is not the username
  const fullLink = slug ? `${pageLink}/${slug}` : pageLink;

  // Prevent iframe from loading if username or pageLink is invalid (causes redirect loop)
  const shouldShowPreview = isValidUsername && isValidPageLink;

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
    if (isLoading && shouldShowPreview) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          console.log('Iframe loading timeout reached for:', fullLink);
          setIsLoading(false);
          setHasError(true);
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, fullLink, shouldShowPreview]);

  // Reset loading state when reloadSignal changes (triggered by mutations)
  useEffect(() => {
    if (shouldShowPreview && reloadSignal > 0) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [reloadSignal, shouldShowPreview]);

  // Show empty state if username is invalid or pageLink is undefined
  if (!shouldShowPreview) {
    return (
      <div className="w-full flex justify-center items-center">
        <div className="relative flex aspect-[9/16] max-h-[120vh] w-full max-w-[394px] md:w-[340px] origin-top scale-[1] flex-col items-center gap-10 mx-auto">
          <div className="h-full w-full">
            <div className="relative h-full w-full overflow-hidden border-muted-foreground/30 sm:rounded-[34px] sm:border-4 rounded-none sm:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] sm:border-muted-foreground/30 border-0 shadow-none">
              <main className="relative h-full w-full flex flex-col bg-gradient-to-t from-accent to-background sm:px-3.5 px-2">
                <div className="flex flex-col justify-center items-center text-center gap-3.5 flex-1 overflow-y-scroll no-scrollbar py-8 min-h-0">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <FileQuestion className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-lg">
                    {!username ? 'No Username Set' : 'No Page Selected'}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {!username
                      ? 'Please set up your username first to preview pages.'
                      : 'Select a page to see its preview.'}
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
    <div className="w-full flex justify-center items-center">
      <div className="relative flex aspect-[9/16] max-h-[120vh] w-full max-w-[394px] md:w-[340px] origin-top scale-[1] flex-col items-center gap-10 mx-auto">
        <div className="h-full w-full">
          <div className="relative h-full w-full overflow-hidden border-muted-foreground/30 sm:rounded-[34px] sm:border-4 rounded-none sm:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] sm:border-muted-foreground/30 border-0 shadow-none">
            {/* Always render iframe but control visibility */}
            <iframe
              key={`${fullLink}-${reloadSignal}-${retryCount}`}
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
                    <AlertTriangle className="w-8 h-8 text-muted-foreground" />
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
