'use server';

import { cache } from 'react';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import {
  link as linkSchema,
  page as pageSchema,
  shortLink,
  linkClickHistory,
} from '@/lib/db/schema';
import { SessionUser } from '@/lib/types';
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { headers } from 'next/headers';

const getAuthenticatedUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session.user as SessionUser;
  if (!user?.id) {
    return null;
  }
  return user;
});

export interface DashboardStats {
  totalClicks: number;
  totalLinks: number;
  totalPages: number;
  totalShortUrlClicks: number;
  healthStatus: {
    healthy: number;
    unhealthy: number;
    timeout: number;
    unknown: number;
  };
}

export interface TopLink {
  id: number;
  title: string;
  url: string;
  clickCount: number;
  pageId: number;
  pageTitle: string;
  healthStatus: string | null;
  lastCheckedAt: number | null;
}

// OPTIMIZATION: Wrap with React.cache() for server-side request deduplication
export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = typeof user.id === 'string' ? Number(user.id) : user.id;

  // OPTIMIZATION: Use existing indexes on page.userId, link.pageId, short_link.userId
  // Execute all queries in parallel using Promise.all
  const [pagesResult, linksResult, shortLinksResult] = await Promise.all([
    // Count user's pages - uses page.userId index
    db
      .select({ count: count() })
      .from(pageSchema)
      .where(eq(pageSchema.userId, userId)),

    // Get all user's links with health status - uses link.pageId index via join
    db
      .select({
        clickCount: linkSchema.clickCount,
        healthStatus: linkSchema.healthStatus,
      })
      .from(linkSchema)
      .innerJoin(pageSchema, eq(linkSchema.pageId, pageSchema.id))
      .where(eq(pageSchema.userId, userId)),

    // Get all user's short link click counts - uses short_link.userId index
    db
      .select({ clickCount: shortLink.clickCount })
      .from(shortLink)
      .where(eq(shortLink.userId, userId)),
  ]);

  const totalPages = Number(pagesResult[0]?.count || 0);

  // Aggregate link statistics
  const totalLinkClicks = linksResult.reduce(
    (sum, link) => sum + link.clickCount,
    0
  );
  const totalLinks = linksResult.length;

  // Aggregate health status
  const healthStatus = {
    healthy: linksResult.filter((link) => link.healthStatus === 'healthy')
      .length,
    unhealthy: linksResult.filter((link) => link.healthStatus === 'unhealthy')
      .length,
    timeout: linksResult.filter((link) => link.healthStatus === 'timeout')
      .length,
    unknown: linksResult.filter(
      (link) => !link.healthStatus || link.healthStatus === 'unknown'
    ).length,
  };

  // Aggregate short link click counts
  const totalShortUrlClicks = shortLinksResult.reduce(
    (sum, link) => sum + link.clickCount,
    0
  );

  return {
    totalClicks: totalLinkClicks + totalShortUrlClicks,
    totalLinks,
    totalPages,
    totalShortUrlClicks,
    healthStatus,
  };
});

// OPTIMIZATION: Wrap with React.cache() for server-side request deduplication
export const getTopLinks = cache(
  async (limit: number = 10): Promise<TopLink[]> => {
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      throw new Error('Unauthorized');
    }

    const userId = typeof user.id === 'string' ? Number(user.id) : user.id;

    // OPTIMIZATION: Uses existing indexes on page.userId and link.pageId
    // Orders by clickCount descending - no index needed for small datasets
    const links = await db
      .select({
        id: linkSchema.id,
        title: linkSchema.title,
        url: linkSchema.url,
        clickCount: linkSchema.clickCount,
        pageId: linkSchema.pageId,
        pageTitle: pageSchema.title,
        healthStatus: linkSchema.healthStatus,
        lastCheckedAt: linkSchema.lastCheckedAt,
      })
      .from(linkSchema)
      .innerJoin(pageSchema, eq(linkSchema.pageId, pageSchema.id))
      .where(eq(pageSchema.userId, userId))
      .orderBy(desc(linkSchema.clickCount))
      .limit(limit);

    return links;
  }
);

export interface ClickTrendDataPoint {
  date: string;
  linkClicks: number;
  shortLinkClicks: number;
  totalClicks: number;
}

// Get click trends from link_click_history table
export const getClickTrends = cache(
  async (days: 7 | 30 | 90 = 7): Promise<ClickTrendDataPoint[]> => {
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      throw new Error('Unauthorized');
    }

    const userId = typeof user.id === 'string' ? Number(user.id) : user.id;

    // Calculate the start timestamp for the query
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // Query click history for links and short links
    // Using SQL date function to group by day
    const [linkClicksResult, shortLinkClicksResult] = await Promise.all([
      db
        .select({
          date: sql<string>`date(${linkClickHistory.clickedAt} / 1000, 'unixepoch')`,
          clicks: count(),
        })
        .from(linkClickHistory)
        .innerJoin(linkSchema, eq(linkClickHistory.linkId, linkSchema.id))
        .innerJoin(pageSchema, eq(linkSchema.pageId, pageSchema.id))
        .where(
          and(
            eq(pageSchema.userId, userId),
            gte(linkClickHistory.clickedAt, startTime)
          )
        )
        .groupBy(sql`date(${linkClickHistory.clickedAt} / 1000, 'unixepoch')`)
        .orderBy(sql`date(${linkClickHistory.clickedAt} / 1000, 'unixepoch')`),

      db
        .select({
          date: sql<string>`date(${linkClickHistory.clickedAt} / 1000, 'unixepoch')`,
          clicks: count(),
        })
        .from(linkClickHistory)
        .innerJoin(shortLink, eq(linkClickHistory.shortLinkId, shortLink.id))
        .where(
          and(
            eq(shortLink.userId, userId),
            gte(linkClickHistory.clickedAt, startTime)
          )
        )
        .groupBy(sql`date(${linkClickHistory.clickedAt} / 1000, 'unixepoch')`)
        .orderBy(sql`date(${linkClickHistory.clickedAt} / 1000, 'unixepoch')`),
    ]);

    // Merge results into a map keyed by date
    const trendMap = new Map<string, ClickTrendDataPoint>();

    // Initialize with link clicks
    for (const row of linkClicksResult) {
      trendMap.set(row.date, {
        date: row.date,
        linkClicks: row.clicks,
        shortLinkClicks: 0,
        totalClicks: row.clicks,
      });
    }

    // Add short link clicks
    for (const row of shortLinkClicksResult) {
      const existing = trendMap.get(row.date);
      if (existing) {
        existing.shortLinkClicks = row.clicks;
        existing.totalClicks += row.clicks;
      } else {
        trendMap.set(row.date, {
          date: row.date,
          linkClicks: 0,
          shortLinkClicks: row.clicks,
          totalClicks: row.clicks,
        });
      }
    }

    // Fill in missing dates with zeros for the requested range
    const result: ClickTrendDataPoint[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existing = trendMap.get(dateStr);
      result.push(
        existing || {
          date: dateStr,
          linkClicks: 0,
          shortLinkClicks: 0,
          totalClicks: 0,
        }
      );
    }

    return result;
  }
);
