'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/dashboard';

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: string;
  isLoading: boolean;
  trend?: string;
}

function StatCard({ title, value, icon, isLoading, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-2xl font-bold">
                {value?.toLocaleString() || 0}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <span className="text-xl">{icon}</span>
          </div>
        </div>
        {trend && <p className="mt-2 text-xs text-muted-foreground">{trend}</p>}
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Clicks"
        value={stats?.totalClicks}
        icon="👆"
        isLoading={isLoading}
      />
      <StatCard
        title="Total Links"
        value={stats?.totalLinks}
        icon="🔗"
        isLoading={isLoading}
      />
      <StatCard
        title="Total Pages"
        value={stats?.totalPages}
        icon="📄"
        isLoading={isLoading}
      />
      <StatCard
        title="Short URL Clicks"
        value={stats?.totalShortUrlClicks}
        icon="🔗"
        isLoading={isLoading}
      />
    </div>
  );
}
