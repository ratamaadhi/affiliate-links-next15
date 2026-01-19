'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserShortLinks } from '@/hooks/queries';
import { Badge } from '@/components/ui/badge';

interface ViewShortUrlsTriggerProps {
  pageId: number;
  pageSlug: string;
}

export function ViewShortUrlsTrigger({
  pageId,
  pageSlug,
}: ViewShortUrlsTriggerProps) {
  // Check if this page has any short URLs
  const { data: allShortUrls } = useUserShortLinks();
  const pageHasUrls = allShortUrls?.some((link) => link.pageId === pageId);

  return (
    <Link
      href={`/dashboard/short-urls?pageId=${pageId}`}
      className={cn(
        'text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1',
        !pageHasUrls && 'opacity-50 pointer-events-none' // Disabled state
      )}
      aria-label={`View short URLs for page: ${pageSlug}`}
    >
      <ExternalLink className="h-4 w-4" />
      <span className="hidden sm:inline">Short URLs</span>
      {pageHasUrls && (
        <Badge variant="secondary" className="ml-1 text-[10px] h-5">
          {allShortUrls?.filter((link) => link.pageId === pageId).length || 0}
        </Badge>
      )}
    </Link>
  );
}
