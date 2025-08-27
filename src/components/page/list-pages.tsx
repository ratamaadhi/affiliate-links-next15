'use client';

import { usePages } from '@/hooks/queries';
import { useSearchParams } from 'next/navigation';

import PaginationWithLink from '../ui/pagination-with-link';
import { Skeleton } from '../ui/skeleton';
import { DeletePageButton } from './delete-page-button';
import { EditPageButton } from './edit-page-button';

export const ListPages = () => {
  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const { data, isLoading } = usePages({ page: pageIndex });

  const pages = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="min-h-[342px] mb-3">
        {!isLoading && pages.length === 0 && (
          <p className="text-sm text-muted-foreground">No pages found.</p>
        )}
        {!isLoading && pages.length > 0 && (
          <ul className="space-y-2">
            {pages.map((page) => (
              <li
                key={page.id}
                className="flex justify-between items-center px-4 py-2 border rounded-md shadow"
              >
                <div>
                  <h3 className="font-medium">{page.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {page.description || 'No description'}
                  </p>
                </div>
                <div className="space-x-2">
                  <EditPageButton data={page} />
                  <DeletePageButton pageId={page.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="flex justify-between items-center px-4 py-2 border rounded-md shadow gap-2"
                key={index}
              >
                <div className="w-full space-y-3">
                  <Skeleton className="w-1/4 h-4" />
                  <Skeleton className="w-full h-4" />
                </div>
                <div className="space-x-2 flex">
                  <Skeleton className="w-8 h-8" />
                  <Skeleton className="w-8 h-8" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PaginationWithLink pagination={pagination} pageSearchParam="_page" />
    </div>
  );
};
