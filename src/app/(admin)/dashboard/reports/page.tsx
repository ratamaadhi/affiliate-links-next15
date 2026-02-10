import LinkReportsList from '@/components/link-reports/link-reports-list';
import PageWrapper from '@/components/page/page-wrapper';
import { AuthProvider } from '@/components/auth/auth-provider';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Reports | Aff-Link',
  description: 'Manage link reports submitted by users',
};

export default async function ReportsPage() {
  const breadcrumbs = [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Reports', url: '/dashboard/reports' },
  ];

  const headersList = await headers();
  const userInfo = headersList.get('x-user-info');
  const user = userInfo ? JSON.parse(userInfo) : null;

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <AuthProvider initialUser={user}>
        <main className="flex flex-col h-full bg-muted/50 rounded-lg p-4 2xl:pt-6">
          <div className="container mx-auto max-w-6xl sm:px-0">
            <div className="mb-3 sm:mb-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Link Reports
                </h1>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Manage and review submitted reports
                </span>
              </div>
            </div>
            <LinkReportsList />
          </div>
        </main>
      </AuthProvider>
    </PageWrapper>
  );
}
