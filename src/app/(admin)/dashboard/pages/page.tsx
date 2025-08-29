import { CreatePageButton } from '@/components/page/create-page-button';
import { ListPages } from '@/components/page/list-pages';
import PageWrapper from '@/components/page/page-wrapper';
import SearchPageInput from '@/components/page/search-page-input';
import { headers } from 'next/headers';
import Link from 'next/link';

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
      <main className="flex flex-col h-full gap-y-2 bg-muted/50 rounded-lg p-4">
        <div className="flex gap-2 xl:w-max w-full rounded-lg px-4 py-2 bg-background shadow border border-muted mb-4 relative overflow-hidden">
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
        <div className="w-full flex flex-col xl:flex-row justify-between gap-6">
          <div className="xl:w-1/2 w-full">
            <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
              <h1 className="xl:text-xl text-lg font-bold ms-1 self-start lg:self-center-safe">
                Your Pages
              </h1>
              <div className="lg:max-w-sm w-full flex gap-2 items-center flex-1 place-self-end-safe">
                <SearchPageInput />
                <CreatePageButton />
              </div>
            </div>
            <ListPages />
          </div>
          <div className="xl:w-1/2 w-full h-96 flex gap-2 bg-muted/50 rounded-lg px-4 py-2 shadow border border-muted">
            <h1 className="text-xl font-bold">Page Preview</h1>
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}
