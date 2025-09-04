'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { InPagination } from '@/lib/types';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactNode, useCallback } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';

type PaginationWithLinkProps = {
  pagination: InPagination | null;
  pageSearchParam?: string;
  minPage?: number;
  maxVisiblePages?: number;
};

function PaginationWithLink({
  pagination,
  pageSearchParam = '_page',
  minPage = 1,
  maxVisiblePages = 5,
}: PaginationWithLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildLink = useCallback(
    (newPage: number) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set(pageSearchParam, String(Math.max(minPage, newPage)));
      return `${pathname}?${newSearchParams.toString()}`;
    },
    [pageSearchParam, searchParams, pathname, minPage]
  );

  const createPageItem = useCallback(
    (pageNum: number) => {
      if (!pagination) return null;
      const { currentPage } = pagination;
      return (
        <PaginationItem key={pageNum}>
          <PaginationLink
            href={buildLink(pageNum)}
            isActive={currentPage === pageNum}
            aria-disabled={currentPage === pageNum}
            className={
              currentPage === pageNum ? 'pointer-events-none' : undefined
            }
          >
            {pageNum}
          </PaginationLink>
        </PaginationItem>
      );
    },
    [buildLink, pagination]
  );

  if (!pagination) {
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Skeleton className="md:w-[100.59px] w-9 h-9" />
          </PaginationItem>
          <PaginationItem>
            <Skeleton className="w-9 h-9" />
          </PaginationItem>
          <PaginationItem>
            <Skeleton className="w-9 h-9" />
          </PaginationItem>
          <PaginationItem>
            <Skeleton className="w-9 h-9" />
          </PaginationItem>
          <PaginationItem>
            <Skeleton className="md:w-[100.59px] w-9 h-9" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }

  const { totalPages, currentPage } = pagination;

  const createEllipsis = (key: string) => (
    <PaginationItem key={key}>
      <PaginationEllipsis />
    </PaginationItem>
  );

  const renderSimplePagination = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1).map(
      createPageItem
    );
  };

  const renderComplexPagination = () => {
    const items: ReactNode[] = [createPageItem(1)];

    if (currentPage > 3) {
      items.push(createEllipsis('start'));
    }

    // Render middle pages
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      items.push(createPageItem(i));
    }

    if (currentPage < totalPages - 2) {
      items.push(createEllipsis('end'));
    }

    items.push(createPageItem(totalPages));
    return items;
  };

  const renderPageNumbers = () => {
    return totalPages <= maxVisiblePages
      ? renderSimplePagination()
      : renderComplexPagination();
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem key="prev">
          <PaginationPrevious
            href={buildLink(Math.max(currentPage - 1, 1))}
            aria-disabled={currentPage === 1}
            tabIndex={currentPage === 1 ? -1 : undefined}
            className={
              currentPage === 1 ? 'pointer-events-none opacity-50' : undefined
            }
          />
        </PaginationItem>
        {renderPageNumbers()}
        <PaginationItem key="next">
          <PaginationNext
            href={buildLink(Math.min(currentPage + 1, totalPages))}
            aria-disabled={currentPage === totalPages}
            tabIndex={currentPage === totalPages ? -1 : undefined}
            className={
              currentPage === totalPages
                ? 'pointer-events-none opacity-50'
                : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default PaginationWithLink;
