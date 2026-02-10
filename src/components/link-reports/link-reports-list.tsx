'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  MoreVertical,
  Clock,
  User,
  Mail,
  ExternalLink,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  Info,
} from 'lucide-react';
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
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: 'Pending',
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
  },
  reviewed: {
    label: 'Reviewed',
    variant: 'default',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  resolved: {
    label: 'Resolved',
    variant: 'default',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  dismissed: {
    label: 'Dismissed',
    variant: 'outline',
    icon: <XCircle className="h-3 w-3" />,
  },
};

const reasonLabels: Record<string, string> = {
  broken: 'Broken',
  inappropriate: 'Inappropriate',
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

interface ReportTableRowProps {
  report: Report;
  onStatusUpdate: (reportId: number, newStatus: string) => void;
  onDelete: (reportId: number) => void;
}

// Report Detail Drawer Component
interface ReportDetailDrawerProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (reportId: number, newStatus: string) => void;
  onDelete: (reportId: number) => void;
}

function ReportDetailDrawer({
  report,
  open,
  onOpenChange,
  onStatusUpdate,
  onDelete,
}: ReportDetailDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!report || newStatus === report.status) return;
    setIsUpdating(true);
    try {
      await onStatusUpdate(report.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!report) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Details
          </DrawerTitle>
          <DrawerDescription>
            Reported on {formatDate(report.createdAt)}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge
              variant={statusLabels[report.status].variant}
              className="gap-1"
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                statusLabels[report.status].icon
              )}
              <span>{statusLabels[report.status].label}</span>
            </Badge>
          </div>

          {/* Link Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              Link Information
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Title</p>
                <p className="text-sm font-medium">{report.linkTitle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">URL</p>
                <a
                  href={report.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {report.linkUrl}
                </a>
              </div>
            </div>
          </div>

          {/* Report Reason */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-muted-foreground" />
              Report Reason
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <Badge variant="outline" className="mb-2">
                {reasonLabels[report.reason] || report.reason}
              </Badge>
              {report.description && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm">{report.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reporter Information */}
          {(report.reporterName || report.reporterEmail) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                Reporter Information
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                {report.reporterName && (
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm">{report.reporterName}</p>
                  </div>
                )}
                {report.reporterEmail && (
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${report.reporterEmail}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {report.reporterEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {report.adminNotes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Admin Notes
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
                <p className="text-sm">{report.adminNotes}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{formatDate(report.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated:</span>
              <span>{formatDate(report.updatedAt)}</span>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t flex-col gap-2">
          {/* Status Actions */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('pending')}
              disabled={isUpdating || report.status === 'pending'}
              className="justify-start"
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('reviewed')}
              disabled={isUpdating || report.status === 'reviewed'}
              className="justify-start"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Reviewed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('resolved')}
              disabled={isUpdating || report.status === 'resolved'}
              className="justify-start"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolved
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('dismissed')}
              disabled={isUpdating || report.status === 'dismissed'}
              className="justify-start"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Dismissed
            </Button>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(report.id);
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Delete Report
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" size="sm" className="flex-1">
                Close
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function ReportTableRow({
  report,
  onStatusUpdate,
  onDelete,
}: ReportTableRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === report.status) return;
    setIsUpdating(true);
    try {
      await onStatusUpdate(report.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <TableRow className="hover:bg-muted/30">
        {/* Link Column */}
        <TableCell className="max-w-[200px] sm:max-w-[250px]">
          <div className="space-y-1">
            {/* Reason Badge */}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {reasonLabels[report.reason] || report.reason}
            </Badge>

            {/* Link Title */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-medium truncate text-sm cursor-help">
                  {report.linkTitle}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">{report.linkTitle}</TooltipContent>
            </Tooltip>

            {/* Link URL */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={report.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 truncate group"
                >
                  <span className="truncate">{report.linkUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="top">{report.linkUrl}</TooltipContent>
            </Tooltip>

            {/* Description */}
            {report.description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground line-clamp-2 cursor-help truncate">
                    {report.description}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {report.description}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Admin Notes */}
            {report.adminNotes && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs bg-muted/50 px-1.5 py-0.5 rounded max-w-fit cursor-help">
                    <span className="font-medium">Note:</span>{' '}
                    {report.adminNotes}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div>
                    <span className="font-medium">Admin Notes:</span>{' '}
                    {report.adminNotes}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>

        {/* Status Column */}
        <TableCell className="w-[110px]">
          <Badge
            variant={statusLabels[report.status].variant}
            className="text-xs shrink-0 gap-1 items-center"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              statusLabels[report.status].icon
            )}
            <span>{statusLabels[report.status].label}</span>
          </Badge>
        </TableCell>

        {/* Reporter Column */}
        <TableCell className="hidden md:table-cell w-[140px]">
          <div className="space-y-0.5">
            {report.reporterName && (
              <div className="flex items-center gap-1 text-xs">
                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{report.reporterName}</span>
              </div>
            )}
            {report.reporterEmail && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{report.reporterEmail}</span>
              </div>
            )}
          </div>
        </TableCell>

        {/* Date Column */}
        <TableCell className="hidden sm:table-cell w-[70px]">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{formatDate(report.createdAt)}</span>
          </div>
        </TableCell>

        {/* Actions Column */}
        <TableCell className="w-[40px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              {/* View Details - Mobile Only */}
              <DropdownMenuItem
                onClick={() => setDrawerOpen(true)}
                className="sm:hidden"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('pending')}
                disabled={isUpdating || report.status === 'pending'}
              >
                <Clock className="h-4 w-4 mr-2" />
                Mark as Pending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('reviewed')}
                disabled={isUpdating || report.status === 'reviewed'}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Mark as Reviewed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('resolved')}
                disabled={isUpdating || report.status === 'resolved'}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('dismissed')}
                disabled={isUpdating || report.status === 'dismissed'}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark as Dismissed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(report.id)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Detail Drawer for Mobile */}
      <ReportDetailDrawer
        report={report}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusUpdate={onStatusUpdate}
        onDelete={onDelete}
      />
    </>
  );
}

function ReportsListSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Link</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Reporter</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-3 w-24" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-3 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-7 w-7 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
        limit: 5,
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
            limit: 5,
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
            limit: 5,
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
    <div className="space-y-3">
      {/* Status Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px] h-9">
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
          <p className="text-xs text-muted-foreground">
            {pagination.totalItems} report
            {pagination.totalItems !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Reports Table */}
      {reports.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            {status === 'all' ? 'No reports yet' : `No ${status} reports`}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[200px] sm:w-[250px]">Link</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
                <TableHead className="hidden md:table-cell w-[140px]">
                  Reporter
                </TableHead>
                <TableHead className="hidden sm:table-cell w-[70px]">
                  Date
                </TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report: Report) => (
                <ReportTableRow
                  key={report.id}
                  report={report}
                  onStatusUpdate={(reportId, newStatus) =>
                    updateStatusMutation.trigger({ reportId, newStatus })
                  }
                  onDelete={(reportId) => deleteMutation.trigger(reportId)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination && reports.length > 0 && (
        <div className="flex justify-center items-center gap-2">
          {pagination.totalPages > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3"
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="h-8 px-3"
              >
                Next
              </Button>
            </>
          )}
          {pagination.totalPages === 1 && (
            <span className="text-xs text-muted-foreground">
              Showing {reports.length} of {pagination.totalItems} report
              {pagination.totalItems !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
