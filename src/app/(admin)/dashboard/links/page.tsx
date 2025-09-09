import LinkPageProvider from '@/components/link/link-page-provider';
import ListLinks from '@/components/link/list-links';
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
        <main className="flex flex-col h-full gap-y-2 bg-muted/50 rounded-lg p-4">
          <div className="w-full flex flex-col xl:flex-row justify-between gap-6">
            <div className="xl:w-1/2 w-full">
              <div className="flex items-center gap-x-2">
                <Label htmlFor="select-page-form">Select Page</Label>
                <SelectPageInput defaultPageSlug={user.username} />
              </div>
              <div>
                <ListLinks />
              </div>
            </div>
            <div className="xl:w-1/2 w-full h-96 flex gap-2 bg-muted/50 rounded-lg px-4 py-2 shadow border border-muted">
              <h1 className="text-xl font-bold">Page Preview</h1>
            </div>
          </div>
        </main>
      </LinkPageProvider>
    </PageWrapper>
  );
}

export default LinksPage;
