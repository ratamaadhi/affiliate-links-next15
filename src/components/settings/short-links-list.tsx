'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeleteShortLink } from '@/hooks/mutations';
import { useUserShortLinks as useUserShortLinksQuery } from '@/hooks/queries';
import { ExternalLink, Trash2, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ShortLinksList() {
  const { data: links, isLoading } = useUserShortLinksQuery();
  const deleteShortLink = useDeleteShortLink();

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Short URL copied to clipboard');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this short link?')) {
      return;
    }
    await deleteShortLink.trigger({ id });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Short URLs</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!links || links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Short URLs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="p-4 rounded-full bg-muted">
            <ExternalLink className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">No short URLs yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Short URLs are automatically generated when you create pages
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Short URLs</span>
          <span className="text-sm font-normal text-muted-foreground">
            {links.length} {links.length === 1 ? 'URL' : 'URLs'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border gap-3 sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start sm:items-center gap-2 mb-2">
                  <code className="text-xs sm:text-sm bg-muted px-2 py-1 rounded break-all">
                    {process.env.NEXT_PUBLIC_BASE_URL}/s/{link.shortCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() =>
                      handleCopy(
                        `${process.env.NEXT_PUBLIC_BASE_URL}/s/${link.shortCode}`
                      )
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <a
                    href={link.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    {link.page?.title || link.targetUrl}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0">
                <div className="text-center sm:text-right">
                  <p className="text-base sm:text-lg font-semibold">
                    {link.clickCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {link.clickCount === 1 ? 'click' : 'clicks'}
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xs sm:text-sm font-medium">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Created</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(link.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
