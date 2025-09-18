import { LinksView } from '@/components/link/links-view';
import { getPageBySlug } from '@/server/pages';
import { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug, username } = await params;

  // fetch information
  const { data } = await getPageBySlug(slug);

  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/${username}/${slug}`,
    },
  };
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { slug } = await params;

  // fetch information
  const { data } = await getPageBySlug(slug);

  return (
    <main className="w-full h-screen bg-muted-foreground sm:pt-10 flex flex-col">
      <LinksView pageData={data} />
    </main>
  );
}
