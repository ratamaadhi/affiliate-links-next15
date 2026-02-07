'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { HealthStatus } from '@/lib/health-check';
import {
  formatResponseTime,
  getHealthStatusIcon,
  getHealthStatusText,
  getRelativeTime,
} from '@/lib/health-check';

export interface HealthBadgeProps {
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
  unhealthy: 'text-red-500',
  timeout: 'text-yellow-500',
  unknown: 'text-gray-500',
};

export function HealthBadge({
  status,
  lastCheckedAt,
  statusCode,
  responseTime,
  errorMessage,
  className,
}: HealthBadgeProps) {
  const healthStatus = status || 'unknown';
  const variant = statusVariantMap[healthStatus];
  const icon = getHealthStatusIcon(healthStatus);
  const text = getHealthStatusText(healthStatus);
  const relativeTime = getRelativeTime(lastCheckedAt);
  const colorClass = statusColorMap[healthStatus];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex flex-col items-end gap-1', className)}>
          <Badge variant={variant} className="gap-1">
            <span className={colorClass}>{icon}</span>
            {text}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[300px]">
        <div className="font-semibold">Status: {text}</div>
        <div className="text-xs text-muted">Last checked: {relativeTime}</div>
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
            <div className="text-xs font-semibold text-destructive">Error:</div>
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
      </TooltipContent>
    </Tooltip>
  );
}
