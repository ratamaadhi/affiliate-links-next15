'use client';

import {
  LinkPageContext,
  LinkPageDispatchContext,
} from '@/context/link-page-context';
import usePagesInfinite from '@/hooks/usePagesInfinite';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import { useCallback, useContext, useEffect } from 'react';
import { CreatePageButton } from './create-page-button';
import { ListPages } from './list-pages';
import SearchPageInput from './search-page-input';

export function PagesContent({ defaultPageSlug }: { defaultPageSlug: string }) {
  const { selectedPage } = useContext(LinkPageContext);
  const dispatch = useContext(LinkPageDispatchContext);

  const {
    data: pages,
    hasMore,
    isLoading,
    page,
    fetchPages,
    handleSearch,
    debouncedSearchTerm,
  } = usePagesInfinite();

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPages(page + 1, debouncedSearchTerm);
    }
  }, [isLoading, hasMore, debouncedSearchTerm, page, fetchPages]);

  const loaderRef = useInfiniteScroll(hasMore, loadMore, isLoading);

  useEffect(() => {
    const shouldSetDefaultValue = !selectedPage && defaultPageSlug;

    if (shouldSetDefaultValue) {
      const defaultValue = pages.find((page) => page.slug === defaultPageSlug);

      if (defaultValue) {
        dispatch({
          type: 'changed',
          payload: defaultValue,
        });
      }
    }
  }, [pages, defaultPageSlug, selectedPage, dispatch]);

  return (
    <>
      <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="xl:text-xl text-lg font-bold ms-1 self-start lg:self-center-safe">
          Your Pages
        </h1>
        <div className="lg:max-w-sm w-full flex gap-2 items-center flex-1 place-self-end-safe">
          <SearchPageInput onSearch={handleSearch} useUrl={false} />
          <CreatePageButton />
        </div>
      </div>
      <ListPages
        defaultPageSlug={defaultPageSlug}
        pages={pages}
        hasMore={hasMore}
        isLoading={isLoading}
        loaderRef={loaderRef}
      />
    </>
  );
}
