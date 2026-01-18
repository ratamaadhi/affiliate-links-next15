import PageWrapper from '@/components/page/page-wrapper';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';

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
        <main className="h-full bg-muted/50 rounded-lg p-2 ">
          <h1 className="text-2xl font-bold mb-2 hidden">Dashboard</h1>
          <div className="flex gap-2 w-max rounded-lg px-4 py-2 bg-background shadow border border-muted">
            <div className="text-nowrap text-sm relative overflow-x-auto no-scrollbar">
              <span className="font-semibold text-foreground/70">
                My Linkid:{' '}
              </span>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
                target="_blank"
                className="hover:underline"
              >{`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}</Link>
            </div>
          </div>
        </main>
      </Suspense>
    </PageWrapper>
  );
}
