import { LinksView } from '@/components/link/links-view';
import {
  CACHE_TTL,
  USERNAME_HISTORY_KEY,
  USER_DEFAULT_PAGE_KEY,
} from '@/lib/cache/cache-keys';
import { cacheGetOrSet } from '@/lib/cache/cache-manager';
import db from '@/lib/db';
import { page, user, usernameHistory } from '@/lib/db/schema';
import { getPageBySlug } from '@/server/pages';
import { eq } from 'drizzle-orm';
import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';

type PageData = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  userId: number;
  themeSettings: unknown;
  createdAt: number;
  updatedAt: number;
};

const cachedGetPageBySlug = cache(getPageBySlug);

/**
 * Check if a username is currently active (being used by a user)
 * @param username - The username to check
 * @returns true if the username is currently active, false otherwise
 */
async function isUsernameActive(username: string): Promise<boolean> {
  try {
    const activeUser = await db.query.user.findFirst({
      where: eq(user.username, username),
      columns: { id: true },
    });
    return !!activeUser;
  } catch {
    return false;
  }
}

type Props = {
  params: Promise<{
    username: string;
    slug?: string;
  }>;
};

async function checkUsernameRedirect(username: string): Promise<string | null> {
  try {
    // First, check if this username is currently active (being used by a user)
    // If it's active, we should NOT redirect - this is the user's current page
    if (await isUsernameActive(username)) {
      return null;
    }

    // Username is not active, check if it's in history (old username)
    const cacheKey = USERNAME_HISTORY_KEY(username);

    const result = await cacheGetOrSet<{ newUsername: string }>(
      cacheKey,
      async () => {
        const historyEntry = await db.query.usernameHistory.findFirst({
          where: eq(usernameHistory.oldUsername, username),
          with: {
            user: {
              columns: { username: true },
            },
          },
        });

        if (historyEntry && historyEntry.user) {
          return { newUsername: historyEntry.user.username };
        }

        return null;
      },
      CACHE_TTL.USERNAME_HISTORY
    );

    if (result.data?.newUsername) {
      return result.data.newUsername;
    }

    // Fallback: if cache misses or fails, query database directly
    const historyEntry = await db.query.usernameHistory.findFirst({
      where: eq(usernameHistory.oldUsername, username),
      with: {
        user: {
          columns: { username: true },
        },
      },
    });

    return historyEntry?.user?.username || null;
  } catch (error) {
    console.error('Error checking username redirect:', error);
    // On cache error, try direct database lookup as fallback
    try {
      // First check if username is active
      if (await isUsernameActive(username)) {
        return null;
      }

      const historyEntry = await db.query.usernameHistory.findFirst({
        where: eq(usernameHistory.oldUsername, username),
        with: {
          user: {
            columns: { username: true },
          },
        },
      });
      return historyEntry?.user?.username || null;
    } catch {
      return null;
    }
  }
}

async function getUserDefaultPage(username: string): Promise<PageData | null> {
  try {
    const cacheKey = USER_DEFAULT_PAGE_KEY(username);

    const result = await cacheGetOrSet<PageData>(
      cacheKey,
      async () => {
        const userData = await db.query.user.findFirst({
          where: eq(user.username, username),
          columns: { id: true },
        });

        if (!userData) {
          return null;
        }

        const userPage = await db.query.page.findFirst({
          where: eq(page.userId, userData.id),
          orderBy: (page, { asc }) => [asc(page.id)],
        });

        return userPage;
      },
      CACHE_TTL.USER_DEFAULT_PAGE
    );

    return result.data;
  } catch (error) {
    console.error('Error getting user default page:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const awaitedParams = await params;
  const { username, slug } = awaitedParams;

  let pageData: PageData | null = null;

  if (slug) {
    const result = await cachedGetPageBySlug(slug);
    if (result.success && result.data) {
      pageData = result.data;
    }
  } else {
    pageData = await getUserDefaultPage(username);
  }

  if (!pageData) {
    return {
      title: 'Page Not Found',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  const url = slug
    ? `${baseUrl}/${username}/${slug}`
    : `${baseUrl}/${username}`;

  return {
    title: pageData.title,
    description: pageData.description || '',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: pageData.title,
      description: pageData.description || '',
      type: 'website',
      url,
      siteName: 'Affiliate Links',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageData.title,
      description: pageData.description || '',
    },
  };
}

export default async function PageView({ params }: Props) {
  const awaitedParams = await params;
  const { username, slug } = awaitedParams;

  let pageData: PageData | null = null;

  if (slug) {
    const result = await cachedGetPageBySlug(slug);
    if (result.success && result.data) {
      pageData = result.data;
    }
  } else {
    pageData = await getUserDefaultPage(username);
  }

  if (!pageData) {
    const newUsername = await checkUsernameRedirect(username);

    if (newUsername) {
      const redirectPath = slug ? `/${newUsername}/${slug}` : `/${newUsername}`;

      // Use permanentRedirect for 301 status code
      permanentRedirect(redirectPath);
    }

    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  const url = slug
    ? `${baseUrl}/${username}/${slug}`
    : `${baseUrl}/${username}`;

  // Generate JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageData.title,
    description: pageData.description || '',
    url,
    datePublished: new Date(pageData.createdAt).toISOString(),
    dateModified: new Date(pageData.updatedAt).toISOString(),
    author: {
      '@type': 'Person',
      name: username,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/10" />
        <div className="relative z-10 container mx-auto px-3 py-6 sm:py-8 lg:py-10">
          <div className="max-w-6xl mx-auto">
            <LinksView
              pageData={pageData}
              username={username}
              currentSlug={slug}
            />
          </div>
        </div>
      </main>
    </>
  );
}

// Set cache headers for public pages
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour
