import PageWrapper from '@/components/page/page-wrapper';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { TopLinksList } from '@/components/dashboard/top-links-list';
import { HealthStatusSummary } from '@/components/dashboard/health-status-summary';
import { ClickTrendsChart } from '@/components/dashboard/click-trends-chart';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import { CopyButton } from '@/components/ui/shadcn-io/copy-button';

export const metadata = {
  title: 'Dashboard | Aff-Link',
  description:
    '💎 The &ldquo;Link in Bio&rdquo; that Actually Sells. Just paste your affiliate links. We&apos;ll instantly turn them into a beautiful, shoppable gallery.',
};

export default async function DashboardPage() {
  const headersList = await headers();
  const userInfo = headersList.get('x-user-info');
  const user = userInfo ? JSON.parse(userInfo) : null;

  const breadcrumbs = [{ title: 'Dashboard', url: '/dashboard' }];

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <Suspense fallback={<div>Loading...</div>}>
        <main className="h-full bg-muted/50 rounded-lg p-4 md:p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 rounded-lg bg-background p-4 shadow-sm border border-muted md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back! Here&apos;s an overview of your links and
                performance.
              </p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 rounded-lg bg-muted/50 px-3 py-2 flex-1 min-w-0">
                <span className="text-xs sm:text-sm font-medium text-foreground/70 shrink-0">
                  My Linkid:
                </span>
                <Link
                  href={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm font-medium text-primary hover:underline truncate"
                  title={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
                >
                  {`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
                </Link>
              </div>
              <CopyButton
                size="default"
                content={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Click Trends Chart - Takes 2/3 of the space on large screens */}
            <div className="lg:col-span-2">
              <ClickTrendsChart />
            </div>

            {/* Sidebar - Takes 1/3 of the space */}
            <div className="space-y-6">
              <HealthStatusSummary />
              <TopLinksList limit={5} />
            </div>
          </div>
        </main>
      </Suspense>
    </PageWrapper>
  );
}
