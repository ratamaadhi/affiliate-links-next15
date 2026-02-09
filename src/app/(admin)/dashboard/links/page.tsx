import { CreateLinkButton } from '@/components/link/create-link-button';
import { DynamicPageLink } from '@/components/link/dynamic-page-link';
import LinkPageProvider from '@/components/link/link-page-provider';
import { LinksMobileDockProvider } from '@/components/link/links-mobile-dock-provider';
import ListLinks from '@/components/link/list-links';
import { MobileDock } from '@/components/link/mobile-dock';
import SearchLinkInput from '@/components/link/search-link-input';
import PageWrapper from '@/components/page/page-wrapper';
import SelectPageInput from '@/components/page/select-page-input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthProvider } from '@/components/auth/auth-provider';
import { FileQuestion } from 'lucide-react';
import dynamic from 'next/dynamic';
import { headers } from 'next/headers';

// Lazy load EnhancedDashboardPreview for better performance
const EnhancedDashboardPreview = dynamic(
  () =>
    import('@/components/link/enhanced-dashboard-preview').then((mod) => ({
      default: mod.EnhancedDashboardPreview,
    })),
  {
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative flex aspect-[9/16] max-h-[120vh] w-full max-w-[394px] md:w-[340px] origin-top scale-[1] flex-col items-center gap-10 mx-auto">
          <div className="h-full w-full">
            <div className="relative h-full w-full overflow-hidden border-muted-foreground/30 sm:rounded-[34px] sm:border-4 rounded-none sm:shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] sm:border-muted-foreground/30 border-0 shadow-none">
              <div className="flex flex-col justify-center items-center text-center gap-3.5 flex-1 overflow-y-scroll no-scrollbar py-8 min-h-0">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

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
      {/* OPTIMIZATION: Pass initial user data to prevent duplicate auth fetches */}
      <AuthProvider initialUser={user}>
        <LinkPageProvider>
          <LinksMobileDockProvider>
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
                    {user?.username ? (
                      <EnhancedDashboardPreview
                        pageLink={`${process.env.NEXT_PUBLIC_BASE_URL}/${user.username}`}
                        username={user.username}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <FileQuestion className="w-12 h-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Set up your username to see preview
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>
            <MobileDock
              username={user?.username}
              pageLink={`${process.env.NEXT_PUBLIC_BASE_URL}/${user?.username}`}
            />
          </LinksMobileDockProvider>
        </LinkPageProvider>
      </AuthProvider>
    </PageWrapper>
  );
}

export default LinksPage;
