'use client';

import { LinkPageContext } from '@/context/link-page-context';
import { useUpdateLink } from '@/hooks/mutations';
import { useLinkInfinite } from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth-client';
import { CheckIcon } from 'lucide-react';
import React, { useContext } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { generatePositionOptions } from '../ui/position-selector';

interface UpdatePositionButtonProps {
  data: {
    id: number;
    displayOrder?: number;
  };
}

export const UpdatePositionButton = ({ data }: UpdatePositionButtonProps) => {
  const { user } = useAuth();
  const { selectedPage, keywordLink } = useContext(LinkPageContext);

  const { trigger, isMutating } = useUpdateLink({
    search: keywordLink || '',
    pageId: selectedPage?.id,
  });

  const { data: linksData } = useLinkInfinite({
    pageId: selectedPage?.id,
    search: '',
  });

  const existingLinks = React.useMemo(() => {
    if (!linksData) return [];
    return linksData.flatMap((page) => page?.data?.data || []);
  }, [linksData]);

  const currentLinkOrder = React.useMemo(() => {
    const sortedLinks = [...existingLinks].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    return sortedLinks.findIndex((link) => link.id === data?.id) + 1;
  }, [existingLinks, data?.id]);

  const positionOptions = React.useMemo(() => {
    // Get the total count from the last page of infinite data
    const lastPage = linksData?.[linksData.length - 1];
    const totalCount =
      lastPage?.data?.pagination?.totalItems || existingLinks.length;
    // Generate options for all possible positions (1 to total count)
    const options = generatePositionOptions(totalCount);
    return options.map((option) => option.value);
  }, [existingLinks, linksData]);

  async function handlePositionChange(newPosition: number) {
    const userId = (await authClient.getSession()).data?.user.id;
    if (!userId) {
      toast.error('You must be logged in to update position');
      return;
    }

    const response = await trigger({
      id: data.id,
      values: {
        displayOrder: newPosition,
      },
    });

    if (response.success) {
      // Success is handled by the SWR cache update
    }
  }

  if ((!user || !user.username) && !selectedPage?.id) {
    return <Skeleton className="h-9 w-full rounded-lg" />;
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="size-8 px-2">
              <span className="text-xs">{currentLinkOrder}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Update Position</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="min-w-fit no-scrollbar max-h-60">
        {positionOptions.map((pos) => (
          <DropdownMenuItem
            key={pos}
            onClick={() => handlePositionChange(pos)}
            className="py-1 px-2 flex justify-between items-center"
          >
            <span>{pos}</span>
            {currentLinkOrder === pos && <CheckIcon />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
