'use client';

import { PageSelect } from '@/lib/db/schema';
import { getPages } from '@/server/pages';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

export const ListPages = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [pages, setPages] = useState<PageSelect[]>([]);

  async function fetchPages() {
    try {
      setIsLoading(true);
      const response = await getPages();
      if (response.success) {
        setPages(response.pages);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPages();
  }, []);

  return (
    <div>
      {!isLoading && pages.length === 0 && (
        <p className="text-sm text-muted-foreground">No pages found.</p>
      )}
      {!isLoading && pages.length > 0 && (
        <ul className="space-y-2">
          {pages.map((page) => (
            <li
              key={page.id}
              className="p-4 border border-secondary rounded-md"
            >
              <h3 className="font-medium">{page.title}</h3>
              <p className="text-sm text-muted-foreground">
                {page.description || 'No description'}
              </p>
            </li>
          ))}
        </ul>
      )}
      {isLoading && (
        <div className="space-y-2 p-4 border border-secondary rounded-md">
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-full h-4" />
        </div>
      )}
    </div>
  );
};
