import { CreateLinkButton } from '@/components/link/create-link-button';
import { DashboardLinksPreview } from '@/components/link/dashboard-links-preview';
import LinkPageProvider from '@/components/link/link-page-provider';
import ListLinks from '@/components/link/list-links';
import SearchLinkInput from '@/components/link/search-link-input';
import PageWrapper from '@/components/page/page-wrapper';
import SelectPageInput from '@/components/page/select-page-input';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/ui/shadcn-io/copy-button';
import { headers } from 'next/headers';
import Link from 'next/link';

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
              <div className="w-full flex items-center gap-2 mb-4">
                <div className="flex flex-1 gap-2 xl:w-max w-full rounded-lg px-4 py-2 bg-background shadow border border-muted relative overflow-hidden">
                  <div className="text-nowrap text-sm relative overflow-x-auto no-scrollbar">
                    <span className="font-semibold text-foreground/70 sticky left-0 bg-background">
                      My Linkid:{' '}
                    </span>
                    <Link
                      href={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
                      target="_blank"
                      className="hover:underline"
                    >{`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}</Link>
                  </div>
                </div>
                <CopyButton
                  content={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
                />
              </div>
              <div className="w-full min-h-0 rounded-lg overflow-hidden relative bg-muted-foreground py-3.5">
                <DashboardLinksPreview
                  pageLink={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
                  username={user.username}
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
