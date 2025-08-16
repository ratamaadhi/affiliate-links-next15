import PageWrapper from '@/components/page-wrapper';

export default async function PagesPage() {
  const breadcrumbs = [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Pages', url: '/dashboard/pages' },
  ];
  return (
    <PageWrapper breadcrumbs={breadcrumbs}>
      <main className="flex flex-col h-full gap-y-2 bg-muted/50 rounded-lg px-4 py-2">
        <h1 className="text-2xl font-bold">Pages</h1>
        <p className="mt-4 text-gray-600">All Pages.</p>
        <div className="flex justify-between items-center gap-2"></div>
      </main>
    </PageWrapper>
  );
}
