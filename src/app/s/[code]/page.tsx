import { redirect } from 'next/navigation';
import { ShortLinkNotFound } from './not-found';
import { getShortLinkRedirect } from '@/lib/cache/short-link-redirects';
import { trackShortLinkClick } from '@/server/short-links';
import { cacheSet, getDeletedShortLinks } from '@/lib/cache/cache-manager';
import { SHORT_LINK_KEY, CACHE_TTL } from '@/lib/cache/cache-keys';
import {
  setMiddlewareRedirect,
  syncDeletedShortLinks,
} from '@/lib/cache/middleware-cache';

type PageProps = {
  params: Promise<{ code: string }>;
};

/**
 * Short link redirect page
 *
 * Redirects are handled by middleware for cached links with:
 * - 301 permanent redirects (SEO-friendly)
 * - Cache-Control headers for CDN/browser caching
 *
 * This page handles:
 * - Cache misses: queries database and performs redirect
 * - Link not found: shows branded 404 page
 *
 * Runs in Node.js runtime (not edge) to allow database access.
 */
export default async function ShortLinkPage(props: PageProps) {
  const params = await props.params;
  const { code } = params;

  // Sync deleted short links from Redis to local middleware cache
  // This ensures this instance knows about recently deleted links
  try {
    const deletedLinks = await getDeletedShortLinks();
    if (deletedLinks.length > 0) {
      syncDeletedShortLinks(deletedLinks);
    }
  } catch (error) {
    console.error('Failed to sync deleted short links:', error);
  }

  // Middleware didn't handle this (cache miss or first access)
  // Query database and perform redirect
  const linkData = await getShortLinkRedirect(code);

  if (!linkData) {
    // Link doesn't exist or is expired
    return <ShortLinkNotFound />;
  }

  // Track the click
  try {
    await trackShortLinkClick(code);
  } catch (error) {
    console.error('Failed to track short link click:', error);
  }

  // Update caches for next time (so middleware will handle it)
  // 1. Update middleware cache (in-memory, fast)
  setMiddlewareRedirect(code, linkData.targetUrl, linkData.expiresAt);

  // 2. Update Redis cache (shared across instances)
  try {
    await cacheSet(
      SHORT_LINK_KEY(code),
      {
        targetUrl: linkData.targetUrl,
        shortCode: linkData.shortCode,
        expiresAt: linkData.expiresAt,
      },
      CACHE_TTL.SHORT_LINK
    );
  } catch (error) {
    console.error('Failed to cache short link in Redis:', error);
  }

  // Perform redirect
  redirect(linkData.targetUrl);
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
