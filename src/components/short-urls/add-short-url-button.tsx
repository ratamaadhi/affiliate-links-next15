'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePages } from '@/hooks/queries';
import { useCreateShortLink } from '@/hooks/mutations';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function AddShortUrlButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);

  // Get all pages for this user
  const { data: pagesData } = usePages({ page: 1, limit: 100, search: '' });
  const pages = pagesData?.data || [];

  const { trigger: createShortLink, isMutating } = useCreateShortLink();

  const handleSubmit = async () => {
    if (!selectedPageId) return;

    const result = await createShortLink({ pageId: selectedPageId });

    if (result) {
      setIsOpen(false);
      setSelectedPageId(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open || !isMutating) {
      setIsOpen(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Short URL
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Add Short URL</DialogTitle>
          <DialogDescription>
            Select a page to create a new short URL for. You can have multiple
            short URLs per page.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="page" className="text-right">
              Page
            </Label>
            <div className="col-span-3">
              <Select
                value={selectedPageId?.toString()}
                onValueChange={(value) => setSelectedPageId(Number(value))}
                disabled={isMutating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((page) => (
                    <SelectItem key={page.id} value={page.id.toString()}>
                      {page.title} ({page.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPageId && (
            <div className="bg-muted p-2.5 sm:p-3 rounded-md space-y-0.5 sm:space-y-1">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-sm text-muted-foreground break-all">
                {process.env.NEXT_PUBLIC_BASE_URL}/s/[generated-code]
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedPageId || isMutating}
          >
            {isMutating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Short URL'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
