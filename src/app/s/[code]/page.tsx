import { CACHE_TTL, SHORT_LINK_KEY } from '@/lib/cache/cache-keys';
import { cacheGetOrSet } from '@/lib/cache/cache-manager';
import { getShortLinkByCode, trackShortLinkClick } from '@/server/short-links';
import { notFound, redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ code: string }>;
};

/**
 * Short link redirect page
 * - If short link exists: redirect to target URL
 * - If not found: show branded 404 page
 */
export default async function ShortLinkPage(props: PageProps) {
  const params = await props.params;
  const { code } = params;

  if (!code) {
    notFound();
  }

  const cacheKey = SHORT_LINK_KEY(code);
  const cachedResult = await cacheGetOrSet(
    cacheKey,
    async () => await getShortLinkByCode(code),
    CACHE_TTL.SHORT_LINK
  );

  const shortLink = cachedResult.data;

  if (!shortLink) {
    notFound();
  }

  // Track click before redirecting
  await trackShortLinkClick(code);

  // Redirect to target URL
  redirect(shortLink.targetUrl);
}

/**
 * Metadata for short link pages
 */
export async function generateMetadata({ params }: PageProps) {
  const awaitedParams = await params;
  return {
    title: `Redirecting from ${awaitedParams.code}...`,
    robots: 'noindex, nofollow',
  };
}

// Disable caching for short link redirects
export const dynamic = 'force-dynamic';
export const revalidate = 0;
