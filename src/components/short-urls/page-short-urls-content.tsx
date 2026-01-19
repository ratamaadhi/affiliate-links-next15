'use client';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ExternalLink, Trash2, Copy, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useDeleteShortLink, useCreateShortLink } from '@/hooks/mutations';
import { useUserShortLinks } from '@/hooks/queries';

interface PageShortUrlsContentProps {
  pageId: number;
  pageSlug: string;
  pageTitle: string;
}

export function PageShortUrlsContent({
  pageId,
  pageSlug,
  pageTitle,
}: PageShortUrlsContentProps) {
  const { data: links, isLoading } = useUserShortLinks();
  const deleteShortLink = useDeleteShortLink();
  const createShortLink = useCreateShortLink();

  // Filter links for this page only
  const pageLinks = links?.filter((link) => link.pageId === pageId) || [];

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Short URL copied to clipboard');
  };

  const handleDelete = async (id: number) => {
    await deleteShortLink.trigger({ id });
  };

  const handleAddShortUrl = async () => {
    const result = await createShortLink.trigger({ pageId });
    if (result) {
      toast.success('Short URL created successfully');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground text-sm">Loading short URLs...</p>
      </div>
    );
  }

  if (pageLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <ExternalLink className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            No short URLs yet for this page
          </p>
          <Button onClick={handleAddShortUrl} className="w-full sm:w-auto">
            <ExternalLink className="mr-2 h-4 w-4" />
            Create First Short URL
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pageLinks
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((link, index) => (
          <div
            key={link.id}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-2.5 sm:p-4 rounded-lg border gap-2 sm:gap-4 bg-background hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start sm:items-center gap-2 mb-1.5 sm:mb-2">
                <code className="text-[11px] sm:text-xs bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded break-all font-mono font-medium text-foreground/90">
                  {process.env.NEXT_PUBLIC_BASE_URL}/s/{link.shortCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 hover:bg-primary/10"
                  onClick={() =>
                    handleCopy(
                      `${process.env.NEXT_PUBLIC_BASE_URL}/s/${link.shortCode}`
                    )
                  }
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {index === 0 && (
                  <Badge
                    variant="default"
                    className="text-[10px] px-1.5 py-0.5 h-fit"
                  >
                    Latest
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">Created </span>
                <time dateTime={new Date(link.createdAt).toISOString()}>
                  {new Date(link.createdAt).toLocaleDateString()}
                </time>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm sm:text-base font-semibold text-foreground">
                  {link.clickCount}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {link.clickCount === 1 ? 'click' : 'clicks'}
                </span>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(link.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Short URL?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete short URL {link.shortCode}.
                      Any clicks tracking will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(link.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
    </div>
  );
}
