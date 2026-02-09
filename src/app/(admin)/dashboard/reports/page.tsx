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
        <main className="container mx-auto py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Link Reports</h1>
            <p className="text-muted-foreground">
              View and manage reports submitted for your links
            </p>
          </div>
          <LinkReportsList />
        </main>
      </AuthProvider>
    </PageWrapper>
  );
}
