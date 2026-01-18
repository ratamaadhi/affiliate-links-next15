import db from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';

  try {
    // Get all users with usernames
    const users = await db.query.user.findMany({
      where: eq(user.username, user.username), // Only get users with username
      columns: {
        username: true,
      },
    });

    // Get all pages
    const pages = await db.query.page.findMany({
      with: {
        user: {
          columns: {
            username: true,
          },
        },
      },
    });

    // Generate sitemap entries
    const sitemapEntries: MetadataRoute.Sitemap = [
      // Homepage
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];

    // Add user profile pages
    for (const userData of users) {
      if (userData.username) {
        sitemapEntries.push({
          url: `${baseUrl}/${userData.username}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // Add individual pages
    for (const pageData of pages) {
      if (pageData.user?.username) {
        sitemapEntries.push({
          url: `${baseUrl}/${pageData.user.username}/${pageData.slug}`,
          lastModified: new Date(pageData.updatedAt),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }

    return sitemapEntries;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return minimal sitemap on error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
