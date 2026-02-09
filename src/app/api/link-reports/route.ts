import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db';
import { linkReport } from '@/lib/db/schema/link-report';
import { link } from '@/lib/db/schema/link';
import { user } from '@/lib/db/schema/auth';
import { checkReportRateLimit, getClientIp } from '@/lib/cache/rate-limiter';
import { eq } from 'drizzle-orm';
import { sendReportEmail } from '@/lib/email/report-notification';

// Zod schema for validation
const reportSchema = z.object({
  linkId: z.number(),
  reporterName: z.string().min(1, 'Name is required'),
  reporterEmail: z.string().email('Invalid email address'),
  reason: z.enum(['broken', 'inappropriate', 'spam', 'other']),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = reportSchema.parse(body);

    // Check rate limit
    const ip = getClientIp(request);
    const rateLimit = await checkReportRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many reports. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    // Verify link exists and get page owner info
    const linkData = await db.query.link.findFirst({
      where: eq(link.id, validatedData.linkId),
      with: {
        page: {
          columns: {
            userId: true,
            title: true,
          },
        },
      },
    });

    if (!linkData) {
      return NextResponse.json(
        { success: false, message: 'Link not found' },
        { status: 404 }
      );
    }

    // Get page owner email
    const pageOwner = await db.query.user.findFirst({
      where: eq(user.id, linkData.page.userId),
      columns: {
        email: true,
        name: true,
      },
    });

    if (!pageOwner) {
      return NextResponse.json(
        { success: false, message: 'Page owner not found' },
        { status: 404 }
      );
    }

    // Create report
    const [newReport] = await db
      .insert(linkReport)
      .values({
        linkId: validatedData.linkId,
        reporterName: validatedData.reporterName,
        reporterEmail: validatedData.reporterEmail,
        reason: validatedData.reason,
        description: validatedData.description,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      })
      .returning();

    // Send email notification to page owner
    try {
      await sendReportEmail({
        to: pageOwner.email,
        pageOwnerName: pageOwner.name,
        linkTitle: linkData.title,
        linkUrl: linkData.url,
        reportReason: validatedData.reason,
        reportDescription: validatedData.description,
        reporterName: validatedData.reporterName,
        reporterEmail: validatedData.reporterEmail,
      });
    } catch (emailError) {
      console.error('Failed to send report email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        id: newReport.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Error submitting report:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
