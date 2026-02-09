'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  getReportsForUser,
  updateReportStatus,
  deleteReport,
} from '@/server/link-reports';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';

const statusLabels: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
  }
> = {
  pending: { label: 'Pending', variant: 'secondary' },
  reviewed: { label: 'Reviewed', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'default' },
  dismissed: { label: 'Dismissed', variant: 'outline' },
};

const reasonLabels: Record<string, string> = {
  broken: 'Broken Link',
  inappropriate: 'Inappropriate Content',
  spam: 'Spam',
  other: 'Other',
};

interface Report {
  id: number;
  linkId: number;
  linkTitle: string;
  linkUrl: string;
  reporterName: string | null;
  reporterEmail: string | null;
  reason: string;
  description: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: number;
  updatedAt: number;
}

interface ReportCardProps {
  report: Report;
  onStatusUpdate: (reportId: number, newStatus: string) => void;
  onDelete: (reportId: number) => void;
}

function ReportCard({ report, onStatusUpdate, onDelete }: ReportCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(report.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{report.linkTitle}</h3>
            <Badge variant={statusLabels[report.status].variant} className="">
              {statusLabels[report.status].label}
            </Badge>
          </div>

          <a
            href={report.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:underline block"
          >
            {report.linkUrl}
          </a>

          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">
              <strong>Reason:</strong>{' '}
              {reasonLabels[report.reason] || report.reason}
            </p>
            {report.description && (
              <p className="text-muted-foreground">
                <strong>Description:</strong> {report.description}
              </p>
            )}
            {(report.reporterName || report.reporterEmail) && (
              <p className="text-muted-foreground">
                <strong>Reported by:</strong>{' '}
                {report.reporterName && `${report.reporterName} `}
                {report.reporterEmail && `(${report.reporterEmail})`}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>

          {report.adminNotes && (
            <div className="bg-muted p-2 rounded text-sm">
              <strong>Admin Notes:</strong> {report.adminNotes}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={report.status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onDelete(report.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

function ReportsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function LinkReportsList() {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const { mutate } = useSWRConfig();

  const { data, isLoading, error } = useSWR(
    `/reports?status=${status}&page=${page}`,
    () =>
      getReportsForUser({
        status: status === 'all' ? undefined : status,
        page,
        limit: 10,
      })
  );

  const updateStatusMutation = useSWRMutation(
    '/reports',
    async (
      _: string,
      { arg }: { arg: { reportId: number; newStatus: string } }
    ) =>
      updateReportStatus({
        reportId: arg.reportId,
        status: arg.newStatus as any,
      }),
    {
      onSuccess: () => {
        mutate(() =>
          getReportsForUser({
            status: status === 'all' ? undefined : status,
            page,
            limit: 10,
          })
        );
        toast.success('Report status updated');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to update status');
      },
    }
  );

  const deleteMutation = useSWRMutation(
    '/reports',
    async (_: string, { arg }: { arg: number }) => deleteReport(arg),
    {
      onSuccess: () => {
        mutate(() =>
          getReportsForUser({
            status: status === 'all' ? undefined : status,
            page,
            limit: 10,
          })
        );
        toast.success('Report deleted');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to delete report');
      },
    }
  );

  if (isLoading) {
    return <ReportsListSkeleton />;
  }

  if (error || !data?.success) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Failed to load reports. Please try again.
        </p>
      </div>
    );
  }

  const reports = data.data?.data || [];
  const pagination = data.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="flex items-center gap-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>

        {pagination && (
          <p className="text-sm text-muted-foreground">
            {pagination.totalItems} report
            {pagination.totalItems !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {status === 'all' ? 'No reports yet' : `No ${status} reports`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report: Report) => (
            <ReportCard
              key={report.id}
              report={report}
              onStatusUpdate={(reportId, newStatus) =>
                updateStatusMutation.trigger({ reportId, newStatus })
              }
              onDelete={(reportId) => deleteMutation.trigger(reportId)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
