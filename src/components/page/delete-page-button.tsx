import { useDeletePage } from '@/hooks/mutations';
import { authClient } from '@/lib/auth-client';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export const DeletePageButton = ({ pageId }) => {
  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const search = searchParams.get('_search') ?? '';

  const [isOpen, setIsOpen] = useState(false);

  const { trigger, isMutating } = useDeletePage({ page: pageIndex, search });

  const handleDelete = async () => {
    const userId = (await authClient.getSession()).data?.user.id;
    if (!userId) {
      toast.error('You must be logged in to delete a page');
      return;
    }
    const response = await trigger({
      id: pageId,
    });

    if (response.success) {
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            className="size-8"
            onClick={() => setIsOpen(true)}
            disabled={isMutating}
          >
            <HiOutlineTrash />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Delete page</p>
        </TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the page
            and all its links.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isMutating}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
