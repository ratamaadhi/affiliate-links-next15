'use client';

import { useRouter } from 'next/navigation';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { PageShortUrlsContent } from './page-short-urls-content';

interface ViewShortUrlsDrawerProps {
  pageId: number;
  pageSlug: string;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
}

export function ViewShortUrlsDrawer({
  pageId,
  pageSlug,
  open,
  onOpenChange,
}: ViewShortUrlsDrawerProps) {
  const router = useRouter();

  const handleManageAll = () => {
    router.push('/dashboard/short-urls');
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Short URLs for {pageSlug}</DrawerTitle>
          <DrawerDescription>
            Manage all short URLs for this page
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <PageShortUrlsContent
            pageId={pageId}
            pageSlug={pageSlug}
            pageTitle={pageSlug}
          />
        </div>

        <div className="p-4 border-t bg-muted/20 flex gap-2">
          <Button onClick={handleManageAll} className="w-full">
            Manage All Short URLs
          </Button>
        </div>

        <DrawerClose asChild>
          <Button variant="ghost" className="sr-only">
            Close
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}
