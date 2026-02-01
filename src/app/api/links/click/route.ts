import { trackLinkClick } from '@/server/links';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { linkId } = await request.json();

    // Validate linkId - accept both number and numeric string
    const numericLinkId =
      typeof linkId === 'string' ? parseInt(linkId, 10) : linkId;
    if (linkId === null || linkId === undefined || isNaN(numericLinkId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid link ID' },
        { status: 400 }
      );
    }

    const result = await trackLinkClick(numericLinkId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to track click' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking link click:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
