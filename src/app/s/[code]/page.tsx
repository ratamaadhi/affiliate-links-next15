import { ShortLinkNotFound } from './not-found';

type PageProps = {
  params: Promise<{ code: string }>;
};

/**
 * Short link not-found page
 *
 * Redirects are handled by middleware for optimal performance with:
 * - 301 permanent redirects (SEO-friendly)
 * - Cache-Control headers for CDN/browser caching
 *
 * This page only renders when the short link doesn't exist,
 * showing a branded 404 page to users.
 */
export default async function ShortLinkPage(props: PageProps) {
  // If middleware didn't handle the redirect, the link doesn't exist
  // Show the branded 404 page
  return <ShortLinkNotFound />;
}

/**
 * Metadata for short link pages
 */
export async function generateMetadata({ params }: PageProps) {
  const awaitedParams = await params;
  return {
    title: `Link not found: ${awaitedParams.code}`,
    robots: 'noindex, nofollow',
  };
}

// Disable caching for 404 pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;
