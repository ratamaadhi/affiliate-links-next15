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
    <main className="w-full h-screen bg-muted-foreground sm:pt-10 flex flex-col">
      <LinksView pageData={data} />
    </main>
  );
}
