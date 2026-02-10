'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/dashboard';

export function HealthStatusSummary() {
  const { data: stats, isLoading } = useDashboardStats();

  const healthData = [
    {
      status: 'healthy',
      label: 'Healthy',
      count: stats?.healthStatus?.healthy || 0,
      variant: 'default' as const,
      icon: '✓',
    },
    {
      status: 'unhealthy',
      label: 'Unhealthy',
      count: stats?.healthStatus?.unhealthy || 0,
      variant: 'destructive' as const,
      icon: '✗',
    },
    {
      status: 'timeout',
      label: 'Timeout',
      count: stats?.healthStatus?.timeout || 0,
      variant: 'secondary' as const,
      icon: '⏱',
    },
    {
      status: 'unknown',
      label: 'Unknown',
      count: stats?.healthStatus?.unknown || 0,
      variant: 'outline' as const,
      icon: '?',
    },
  ];

  const totalLinks =
    (stats?.healthStatus?.healthy || 0) +
    (stats?.healthStatus?.unhealthy || 0) +
    (stats?.healthStatus?.timeout || 0) +
    (stats?.healthStatus?.unknown || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Health</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : totalLinks > 0 ? (
          <div className="space-y-3">
            {healthData.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between"
              >
                <Badge variant={item.variant} className="gap-1">
                  <span>{item.icon}</span>
                  {item.label}
                </Badge>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No links to check health status.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
