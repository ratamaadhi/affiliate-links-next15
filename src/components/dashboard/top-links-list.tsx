'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopLinks } from '@/hooks/dashboard';
import { HealthBadge } from '@/components/link/health-badge';
import { type HealthStatus } from '@/lib/health-check';
import Link from 'next/link';

export function TopLinksList({ limit = 5 }: { limit?: number }) {
  const { data: links, isLoading } = useTopLinks(limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Links</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(limit)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : links && links.length > 0 ? (
          <div className="space-y-3">
            {links.map((link, index) => (
              <Link
                key={link.id}
                href={`/pages/${link.pageId}/links`}
                className="block"
              >
                <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{link.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <HealthBadge
                      status={(link.healthStatus || 'unknown') as HealthStatus}
                      lastCheckedAt={link.lastCheckedAt}
                      statusCode={null}
                      responseTime={null}
                      errorMessage={null}
                    />
                    <p className="text-xs text-muted-foreground">
                      {link.clickCount.toLocaleString()} clicks
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No links yet. Create your first link to see stats here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
