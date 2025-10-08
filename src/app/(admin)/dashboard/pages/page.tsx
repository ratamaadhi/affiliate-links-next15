import { DynamicPageLink } from '@/components/link/dynamic-page-link';
import { EnhancedDashboardPreview } from '@/components/link/enhanced-dashboard-preview';
import LinkPageProvider from '@/components/link/link-page-provider';
import { MobileDock } from '@/components/link/mobile-dock';
import { CreatePageButton } from '@/components/page/create-page-button';
import { ListPages } from '@/components/page/list-pages';
import PageWrapper from '@/components/page/page-wrapper';
import { PagesMobileDockProvider } from '@/components/page/pages-mobile-dock-provider';
import SearchPageInput from '@/components/page/search-page-input';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Pages | Aff-Link',
  description:
    '💎 The &ldquo;Link in Bio&rdquo; that Actually Sells. Just paste your affiliate links. We&apos;ll instantly turn them into a beautiful, shoppable gallery.',
};

export default async function PagesPage() {
  const breadcrumbs = [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Pages', url: '/dashboard/pages' },
  ];

  const headersList = await headers();
  const userInfo = headersList.get('x-user-info');
  const user = userInfo ? JSON.parse(userInfo) : null;

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <LinkPageProvider>
        <PagesMobileDockProvider>
          <main className="flex flex-col h-full gap-y-2 bg-muted/50 rounded-lg p-4 2xl:pt-8">
            <div className="w-full flex flex-col xl:flex-row justify-between gap-4 max-w-7xl mx-auto">
              <div className="w-full flex-1">
                <div className="max-w-[640px] w-full mx-auto">
                  <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="xl:text-xl text-lg font-bold ms-1 self-start lg:self-center-safe">
                      Your Pages
                    </h1>
                    <div className="lg:max-w-sm w-full flex gap-2 items-center flex-1 place-self-end-safe">
                      <SearchPageInput />
                      <CreatePageButton />
                    </div>
                  </div>
                  <ListPages defaultPageSlug={user?.username || ''} />
                </div>
              </div>
              <div className="hidden md:block min-w-[200px] max-w-[460px] mx-auto w-full">
                <div className="mb-4">
                  <DynamicPageLink />
                </div>
                <div className="w-full min-h-0 rounded-lg overflow-hidden relative bg-muted-foreground py-3.5">
                  <EnhancedDashboardPreview
                    pageLink={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username || ''}`}
                    username={user?.username || ''}
                  />
                </div>
              </div>
            </div>
          </main>
          <MobileDock
            username={user?.username}
            pageLink={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username || ''}`}
          />
        </PagesMobileDockProvider>
      </LinkPageProvider>
    </PageWrapper>
  );
}
