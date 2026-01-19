import PageWrapper from '@/components/page/page-wrapper';
import { AddShortUrlButton } from '@/components/short-urls/add-short-url-button';
import { EnhancedShortUrlsList } from '@/components/short-urls/enhanced-short-urls-list';

export const metadata = {
  title: 'Short URLs | Aff-Link',
  description: 'Manage your short URLs and create new ones for your pages',
};

export default async function ShortUrlsPage() {
  const breadcrumbs = [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Short URLs', url: '/dashboard/short-urls' },
  ];

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <main className="flex flex-col h-full gap-y-2 bg-muted/50 rounded-lg p-4 2xl:pt-8">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Short URLs
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Create and manage short URLs for your pages
              </p>
            </div>
            <AddShortUrlButton />
          </div>

          <EnhancedShortUrlsList />
        </div>
      </main>
    </PageWrapper>
  );
}
