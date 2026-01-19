'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PageShortUrlsContent } from './page-short-urls-content';

interface ViewShortUrlsDialogProps {
  pageId: number;
  pageSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewShortUrlsDialog({
  pageId,
  pageSlug,
  open,
  onOpenChange,
}: ViewShortUrlsDialogProps) {
  const router = useRouter();

  const handleManageAll = () => {
    router.push('/dashboard/short-urls');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Short URLs for {pageSlug}</DialogTitle>
          <DialogDescription>
            Manage all short URLs for this page
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <PageShortUrlsContent
            pageId={pageId}
            pageSlug={pageSlug}
            pageTitle={pageSlug}
          />
        </div>

        <div className="p-4 border-t flex gap-2">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={handleManageAll}>Manage All Short URLs</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
