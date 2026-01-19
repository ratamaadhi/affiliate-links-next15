'use client';

import { Button } from '@/components/ui/button';
import { Link2 } from 'lucide-react';
import { useUserShortLinks } from '@/hooks/queries';

interface ViewShortUrlsButtonProps {
  pageId: number;
  pageSlug: string;
  onClick?: () => void;
}

export function ViewShortUrlsButton({
  pageId,
  pageSlug,
  onClick,
}: ViewShortUrlsButtonProps) {
  // Check if this page has any short URLs
  const { data: allShortUrls } = useUserShortLinks();
  const pageHasUrls = allShortUrls?.some((link) => link.pageId === pageId);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-primary/10"
      aria-label={`View short URLs for page: ${pageSlug}`}
      disabled={!pageHasUrls}
      onClick={onClick}
    >
      <Link2 className="h-3 w-3 sm:h-4 sm:w-4" />
    </Button>
  );
}
