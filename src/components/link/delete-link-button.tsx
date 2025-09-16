import { LinkPageContext } from '@/context/link-page-context';
import { useDeleteLink } from '@/hooks/mutations';
import { authClient } from '@/lib/auth-client';
import { useContext, useState } from 'react';
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

export const DeleteLinkButton = ({ linkId, pageId }) => {
  const { selectedPage, keywordLink } = useContext(LinkPageContext);

  const [isOpen, setIsOpen] = useState(false);

  const { trigger, isMutating } = useDeleteLink({
    search: keywordLink || '',
    pageId: selectedPage?.id,
  });

  const handleDelete = async () => {
    const userId = (await authClient.getSession()).data?.user.id;
    if (!userId) {
      toast.error('You must be logged in to delete a page');
      return;
    }
    const response = await trigger({
      id: linkId,
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
            variant="ghost"
            className="size-8"
            onClick={() => setIsOpen(true)}
            disabled={isMutating}
          >
            <HiOutlineTrash />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Delete link</p>
        </TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the link.
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
