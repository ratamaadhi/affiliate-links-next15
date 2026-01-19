'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeleteShortLink } from '@/hooks/mutations';
import { useUserShortLinks } from '@/hooks/queries';
import { ExternalLink, Trash2, Copy, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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

export function EnhancedShortUrlsList() {
  const { data: links, isLoading } = useUserShortLinks();
  const deleteShortLink = useDeleteShortLink();

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Short URL copied to clipboard');
  };

  const handleDelete = async (id: number) => {
    await deleteShortLink.trigger({ id });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading short URLs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!links || links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No short URLs yet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 rounded-full bg-muted">
              <ExternalLink className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-muted-foreground mb-2 sm:mb-4">
                Create your first short URL for any of your pages
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-[280px] mx-auto">
                Short URLs are great for sharing on social media, emails, or
                anywhere you need a short URL
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group links by page
  const groupedLinks = links.reduce(
    (acc, link) => {
      const pageId = link.pageId;
      if (!acc[pageId]) {
        acc[pageId] = {
          page: link.page,
          links: [],
        };
      }
      acc[pageId].links.push(link);
      return acc;
    },
    {} as Record<number, { page: any; links: typeof links }>
  );

  return (
    <div className="space-y-2 sm:space-y-3">
      {Object.values(groupedLinks).map(({ page, links: pageLinks }) => (
        <Card key={page.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{page.title}</CardTitle>
              <Badge variant="secondary" className="">
                <span>
                  {pageLinks.length} {pageLinks.length === 1 ? 'URL' : 'URLs'}
                </span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{page.slug}</p>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {pageLinks
              .sort((a, b) => b.createdAt - a.createdAt) // Newest first
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
                            This will permanently delete short URL{' '}
                            {link.shortCode}. Any clicks tracking will be lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(link.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
