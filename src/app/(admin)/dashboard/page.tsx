import PageWrapper from '@/components/page-wrapper';
import { headers } from 'next/headers';

export default async function DashboardPage() {
  const headersList = await headers();
  const userInfo = headersList.get('x-user-info');
  const user = userInfo ? JSON.parse(userInfo) : null;

  const breadcrumbs = [{ title: 'Dashboard', url: '/dashboard' }];

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <main className="h-full bg-muted/50 rounded-lg p-2 ">
        <h1 className="text-2xl font-bold mb-2 hidden">Dashboard</h1>
        <div className="flex gap-2 w-max rounded-lg px-4 py-2 bg-background shadow border border-muted">
          <div className="text-nowrap text-sm">
            <span className="font-semibold">My Linkid: </span>
            <a
              href={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
              target="_blank"
              className="hover:underline"
            >{`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}</a>
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}
