import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard skeleton loader.
 * Uses plain divs instead of Sidebar components to avoid requiring SidebarProvider context.
 */
export function DashboardSkeleton() {
  return (
    <>
      {/* Sidebar skeleton - mimics the visual layout of Sidebar variant="inset" */}
      <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r bg-background p-4">
        {/* Header skeleton */}
        <div className="mb-4 flex items-center gap-3 rounded-lg p-2">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Menu items skeleton */}
        <div className="space-y-1">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>

        {/* Footer skeleton */}
        <div className="absolute bottom-4 left-4 right-4">
          <Skeleton className="h-12 w-full" />
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="ml-64 flex-1 p-6">
        <div className="max-w-4xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </>
  );
}
