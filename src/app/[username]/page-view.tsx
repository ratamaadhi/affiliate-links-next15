import { LinksView } from '@/components/link/links-view';
import { getPageBySlug } from '@/server/pages';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

// Wrap getPageBySlug with React's cache function to deduplicate requests
const cachedGetPageBySlug = cache(getPageBySlug);

type Props = {
  params: Promise<{
    username: string;
    slug?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const awaitedParams = await params;
  const slug = awaitedParams.slug || awaitedParams.username;
  const { data } = await cachedGetPageBySlug(slug);

  if (!data) {
    return {
      title: 'Page Not Found',
    };
  }

  const url = awaitedParams.slug
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/${awaitedParams.username}/${awaitedParams.slug}`
    : `${process.env.NEXT_PUBLIC_BASE_URL}/${awaitedParams.username}`;

  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      type: 'website',
      url,
    },
  };
}

export default async function PageView({ params }: Props) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug || awaitedParams.username;
  const { data } = await cachedGetPageBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/10" />
      {/* Main content - more compact */}
      <div className="relative z-10 container mx-auto px-3 py-6 sm:py-8 lg:py-10">
        <div className="max-w-6xl mx-auto">
          <LinksView pageData={data} />
        </div>
      </div>
    </main>
  );
}
