import PageWrapper from '@/components/page/page-wrapper';
import SelectPageInput from '@/components/page/select-page-input';

export const metadata = {
  title: 'Links | Aff-Link',
  description:
    '💎 The &ldquo;Link in Bio&rdquo; that Actually Sells. Just paste your affiliate links. We&apos;ll instantly turn them into a beautiful, shoppable gallery.',
};

function LinksPage() {
  const breadcrumbs = [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Links', url: '/dashboard/links' },
  ];
  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <main className="flex flex-col h-full gap-y-2 bg-muted/50 rounded-lg p-4">
        <SelectPageInput />
      </main>
    </PageWrapper>
  );
}

export default LinksPage;
