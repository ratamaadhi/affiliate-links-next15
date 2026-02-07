'use client';

import { Button } from '@/components/ui/button';
import { LinkPageContext } from '@/context/link-page-context';
import { useCheckLinkHealth } from '@/hooks/mutations';
import { useSearchParams } from 'next/navigation';
import { useContext } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface CheckHealthButtonProps {
  linkId: number;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function CheckHealthButton({
  linkId,
  className,
  variant = 'ghost',
  size = 'icon',
}: CheckHealthButtonProps) {
  const { selectedPage } = useContext(LinkPageContext);
  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const search = searchParams.get('_search') ?? '';

  const { trigger, isMutating } = useCheckLinkHealth({
    page: pageIndex,
    search,
    pageId: selectedPage?.id,
  });

  const handleCheckHealth = async () => {
    await trigger({ linkId });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size={size}
            onClick={handleCheckHealth}
            disabled={isMutating}
            className={cn(className, 'size-8')}
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isMutating ? 'Checking link health...' : 'Check link health'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CheckHealthButton;
