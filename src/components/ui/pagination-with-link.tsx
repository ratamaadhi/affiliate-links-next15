'use client';

import { Skeleton } from '@/components/ui/skeleton';
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

type PaginationInfo = {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
};

type PaginationWithLinkProps = {
  pagination: PaginationInfo | null;
  pageSearchParam?: string;
};

function PaginationWithLink({
  pagination,
  pageSearchParam = '_page',
}: PaginationWithLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildLink = useCallback(
    (newPage: number) => {
      const key = pageSearchParam || 'page';
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set(key, String(newPage));
      return `${pathname}?${newSearchParams.toString()}`;
    },
    [pageSearchParam, searchParams, pathname]
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

  const renderPageNumbers = () => {
    const items: ReactNode[] = [];
    const maxVisiblePages = 5;

    const createPageItem = (pageNum: number) => {
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
    };

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(createPageItem(i));
      }
    } else {
      items.push(createPageItem(1));

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(createPageItem(i));
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(createPageItem(totalPages));
    }

    return items;
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
