'use server';

import { cache } from 'react';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { linkReport } from '@/lib/db/schema/link-report';
import { link as linkSchema } from '@/lib/db/schema/link';
import { page as pageSchema } from '@/lib/db/schema/page';
import { and, count, desc, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { SessionUser } from '@/lib/types';

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

// Get all reports for links owned by the authenticated user
export async function getReportsForUser(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { page = 1, limit = 10, status } = params;
  const offset = (page - 1) * limit;

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Build where condition
    const statusCondition = status ? eq(linkReport.status, status) : undefined;

    // Get reports for links owned by this user
    const [reports, [totalCount]] = await Promise.all([
      db
        .select({
          id: linkReport.id,
          linkId: linkReport.linkId,
          linkTitle: linkSchema.title,
          linkUrl: linkSchema.url,
          reporterName: linkReport.reporterName,
          reporterEmail: linkReport.reporterEmail,
          reason: linkReport.reason,
          description: linkReport.description,
          status: linkReport.status,
          adminNotes: linkReport.adminNotes,
          createdAt: linkReport.createdAt,
          updatedAt: linkReport.updatedAt,
        })
        .from(linkReport)
        .innerJoin(linkSchema, eq(linkReport.linkId, linkSchema.id))
        .innerJoin(pageSchema, eq(linkSchema.pageId, pageSchema.id))
        .where(
          statusCondition
            ? and(eq(pageSchema.userId, Number(user.id)), statusCondition)
            : eq(pageSchema.userId, Number(user.id))
        )
        .orderBy(desc(linkReport.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(linkReport)
        .innerJoin(linkSchema, eq(linkReport.linkId, linkSchema.id))
        .innerJoin(pageSchema, eq(linkSchema.pageId, pageSchema.id))
        .where(
          statusCondition
            ? and(eq(pageSchema.userId, Number(user.id)), statusCondition)
            : eq(pageSchema.userId, Number(user.id))
        ),
    ]);

    const totalPages = Math.ceil(Number(totalCount.count) / limit);

    return {
      success: true,
      data: {
        data: reports,
        pagination: {
          totalItems: Number(totalCount.count),
          itemCount: reports.length,
          itemsPerPage: limit,
          totalPages,
          currentPage: page,
        },
      },
    };
  } catch (error) {
    console.error('Error getting reports:', error);
    return {
      success: false,
      message: 'Failed to get reports',
    };
  }
}

// Update report status
export async function updateReportStatus({
  reportId,
  status,
  adminNotes,
}: {
  reportId: number;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
}) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Verify the report is for a link owned by this user
    const [reportData] = await db
      .select({ ownerId: pageSchema.userId })
      .from(linkReport)
      .innerJoin(linkSchema, eq(linkReport.linkId, linkSchema.id))
      .innerJoin(pageSchema, eq(linkSchema.pageId, pageSchema.id))
      .where(eq(linkReport.id, reportId));

    if (!reportData) {
      return { success: false, message: 'Report not found' };
    }

    if (reportData.ownerId !== Number(user.id)) {
      return { success: false, message: 'Forbidden' };
    }

    await db
      .update(linkReport)
      .set({
        status,
        adminNotes,
        updatedAt: Date.now(),
      })
      .where(eq(linkReport.id, reportId));

    return { success: true, message: 'Report updated successfully' };
  } catch (error) {
    console.error('Error updating report:', error);
    return { success: false, message: 'Failed to update report' };
  }
}

// Delete report
export async function deleteReport(reportId: number) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Verify ownership
    const [reportData] = await db
      .select({ ownerId: pageSchema.userId })
      .from(linkReport)
      .innerJoin(linkSchema, eq(linkReport.linkId, linkSchema.id))
      .innerJoin(pageSchema, eq(linkSchema.pageId, pageSchema.id))
      .where(eq(linkReport.id, reportId));

    if (!reportData) {
      return { success: false, message: 'Report not found' };
    }

    if (reportData.ownerId !== Number(user.id)) {
      return { success: false, message: 'Forbidden' };
    }

    await db.delete(linkReport).where(eq(linkReport.id, reportId));

    return { success: true, message: 'Report deleted successfully' };
  } catch (error) {
    console.error('Error deleting report:', error);
    return { success: false, message: 'Failed to delete report' };
  }
}
