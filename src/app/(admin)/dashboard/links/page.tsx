import { CreateLinkButton } from '@/components/link/create-link-button';
import { EnhancedDashboardPreview } from '@/components/link/enhanced-dashboard-preview';
import { DynamicPageLink } from '@/components/link/dynamic-page-link';
import LinkPageProvider from '@/components/link/link-page-provider';
import ListLinks from '@/components/link/list-links';
import SearchLinkInput from '@/components/link/search-link-input';
import PageWrapper from '@/components/page/page-wrapper';
import SelectPageInput from '@/components/page/select-page-input';
import { Label } from '@/components/ui/label';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Links | Aff-Link',
  description:
    '💎 The &ldquo;Link in Bio&rdquo; that Actually Sells. Just paste your affiliate links. We&apos;ll instantly turn them into a beautiful, shoppable gallery.',
};

async function LinksPage() {
  const breadcrumbs = [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Links', url: '/dashboard/links' },
  ];

  const headersList = await headers();
  const userInfo = headersList.get('x-user-info');
  const user = userInfo ? JSON.parse(userInfo) : null;

  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <LinkPageProvider>
        <main className="flex flex-col h-full gap-y-2 bg-muted/50 rounded-lg p-4 2xl:pt-8">
          <div className="w-full flex flex-col xl:flex-row justify-between gap-4 max-w-7xl mx-auto flex-1">
            <div className="w-full flex-1">
              <div className="w-full max-w-[640px] mx-auto flex flex-col h-full">
                <div className="flex justify-between items-center gap-x-2 mb-4">
                  <Label
                    htmlFor="select-page-form"
                    className="font-semibold text-lg"
                  >
                    Select Page
                  </Label>
                  <SelectPageInput defaultPageSlug={user.username} />
                </div>
                <div className="mb-4">
                  <CreateLinkButton />
                </div>
                <div className="mb-4">
                  <SearchLinkInput />
                </div>
                <div className="flex-1 min-h-0">
                  <ListLinks />
                </div>
              </div>
            </div>
            <div className="hidden xl:flex min-w-[200px] max-w-[460px] mx-auto w-full h-full flex-col">
              <div className="mb-4">
                <DynamicPageLink />
              </div>
              <div className="w-full min-h-0 rounded-lg overflow-hidden relative bg-muted-foreground py-3.5">
                <EnhancedDashboardPreview
                  pageLink={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
                  username={user?.username || ''}
                />
              </div>
            </div>
          </div>
        </main>
      </LinkPageProvider>
    </PageWrapper>
  );
}

export default LinksPage;
