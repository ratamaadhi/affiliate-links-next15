'use client';

import { Badge } from '@/components/ui/badge';
import { LinkPageContext } from '@/context/link-page-context';
import { useCheckLinkHealth } from '@/hooks/mutations';
import type { HealthStatus } from '@/lib/health-check';
import {
  formatResponseTime,
  getHealthStatusIcon,
  getHealthStatusText,
  getRelativeTime,
} from '@/lib/health-check';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { useContext } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface InteractiveHealthBadgeProps {
  linkId: number;
  status: HealthStatus | null | undefined;
  lastCheckedAt: number | null | undefined;
  statusCode: number | null | undefined;
  responseTime: number | null | undefined;
  errorMessage: string | null | undefined;
  className?: string;
}

const statusVariantMap: Record<
  HealthStatus,
  'default' | 'destructive' | 'outline' | 'secondary'
> = {
  healthy: 'default',
  unhealthy: 'destructive',
  timeout: 'secondary',
  unknown: 'outline',
};

const statusColorMap: Record<HealthStatus, string> = {
  healthy: 'text-green-500',
  unhealthy: 'text-white',
  timeout: 'text-yellow-500',
  unknown: 'text-gray-500',
};

export function InteractiveHealthBadge({
  linkId,
  status,
  lastCheckedAt,
  statusCode,
  responseTime,
  errorMessage,
  className,
}: InteractiveHealthBadgeProps) {
  const { selectedPage } = useContext(LinkPageContext);
  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const search = searchParams.get('_search') ?? '';

  const { trigger, isMutating } = useCheckLinkHealth({
    page: pageIndex,
    search,
    pageId: selectedPage?.id,
  });

  const healthStatus = status || 'unknown';
  const variant = statusVariantMap[healthStatus];
  const icon = getHealthStatusIcon(healthStatus);
  const text = getHealthStatusText(healthStatus);
  const relativeTime = getRelativeTime(lastCheckedAt);
  const colorClass = statusColorMap[healthStatus];

  const handleCheckHealth = async () => {
    await trigger({ linkId });
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={350}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex flex-col items-end gap-1 cursor-pointer',
              className
            )}
            onClick={handleCheckHealth}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCheckHealth();
              }
            }}
          >
            <Badge
              variant={variant}
              className="gap-1 h-6 w-6 sm:w-auto p-0 sm:px-2 sm:py-0.5"
            >
              {isMutating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <span className={colorClass}>{icon}</span>
              )}
              <span className="hidden sm:block">{text}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          <div className="font-semibold">Status: {text}</div>
          <div className="text-xs text-muted">
            Last checked: {relativeTime}
            {isMutating && ' (Refreshing...)'}
          </div>
          {statusCode !== null && statusCode !== undefined && (
            <div className="text-xs">
              Status code:{' '}
              <span
                className={cn(
                  'font-mono',
                  statusCode >= 200 && statusCode < 300
                    ? 'text-green-500'
                    : statusCode >= 300 && statusCode < 400
                      ? 'text-yellow-500'
                      : 'text-red-500'
                )}
              >
                {statusCode}
              </span>
            </div>
          )}
          {responseTime !== null && responseTime !== undefined && (
            <div className="text-xs">
              Response time:{' '}
              <span className="font-mono">
                {formatResponseTime(responseTime)}
              </span>
            </div>
          )}
          {errorMessage && (
            <div className="border-t border-border/50 pt-1">
              <div className="text-xs font-semibold text-destructive">
                Error:
              </div>
              <div className="text-xs text-muted">{errorMessage}</div>
            </div>
          )}
          {lastCheckedAt && (
            <div className="border-t border-border/50 pt-1">
              <div className="text-xs text-muted">
                {new Date(lastCheckedAt).toLocaleString()}
              </div>
            </div>
          )}
          {!isMutating && (
            <div className="text-xs text-muted-foreground mt-1">
              Click to refresh
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default InteractiveHealthBadge;
