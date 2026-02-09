import PageWrapper from '@/components/page/page-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  const breadcrumbs = [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Links', url: '/dashboard/links' },
  ];

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <div className="w-full flex flex-col h-full gap-y-2 bg-muted/50 rounded-lg p-4 2xl:pt-8">
        {/* Main Content - Two Column Layout */}
        <div className="w-full flex flex-col xl:flex-row gap-4 max-w-7xl mx-auto flex-1">
          {/* LEFT COLUMN - Links Management */}
          <div className="w-full flex-1">
            <div className="w-full max-w-[640px] mx-auto flex flex-col h-full">
              {/* Page Selector Row */}
              <div className="flex justify-between items-center gap-x-2 mb-4">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-10 w-48" />
              </div>

              {/* Create Link Button */}
              <div className="mb-4">
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Links List */}
              <div className="flex-1 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-md" />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Preview (Desktop Only) */}
          <div className="hidden xl:flex min-w-[200px] max-w-[460px] mx-auto w-full h-full flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden relative bg-muted-foreground/20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-6">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-6 w-40 rounded" />
                <Skeleton className="h-4 w-56 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Dock Skeleton (Mobile Only) */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="flex justify-center gap-2 bg-muted/80 backdrop-blur-sm rounded-full p-2 shadow-lg border">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-12 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
