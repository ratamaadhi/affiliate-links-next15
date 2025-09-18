'use client';

import {
  LinkPageContext,
  LinkPageDispatchContext,
} from '@/context/link-page-context';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import usePagesInfinite from '@/hooks/usePagesInfinite';
import { cn } from '@/lib/utils';
import { CheckIcon, ChevronsUpDown, Loader2, SearchIcon } from 'lucide-react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { BorderBeam } from '../ui/border-beam';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

function SelectPageInput({ defaultPageSlug }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dispatch = useContext(LinkPageDispatchContext);
  const { selectedPage } = useContext(LinkPageContext);
  const {
    data,
    hasMore,
    handleSearch,
    isLoading,
    fetchPages,
    debouncedSearchTerm,
    page,
  } = usePagesInfinite();

  const dataToList = data.map((ls) => {
    return {
      label: ls.title,
      value: ls.id,
      ...ls,
    };
  });

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPages(page + 1, debouncedSearchTerm);
    }
  }, [isLoading, hasMore, debouncedSearchTerm, page, fetchPages]);

  const loaderRef = useInfiniteScroll(hasMore, loadMore, isLoading);

  function handlingSearch(value) {
    handleSearch(value);
    setSearch(value);
  }

  useEffect(() => {
    const shouldSetDefaultValue =
      !selectedPage && dataToList.length > 0 && defaultPageSlug;

    if (shouldSetDefaultValue) {
      const defaultValue = dataToList.find(
        (list) => list.slug === defaultPageSlug
      );

      if (defaultValue) {
        dispatch({
          type: 'changed',
          payload: defaultValue,
        });
      }
    }
  }, [dataToList, defaultPageSlug, selectedPage]);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="relative w-[200px] justify-between"
          >
            <span className="truncate">
              {selectedPage?.label ? selectedPage?.label : 'Select list...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 flex-srink-0" />
            <BorderBeam duration={4} size={20} />
            <BorderBeam duration={4} delay={2} size={20} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <div className="relative">
            <div className="p-1 border-b">
              <Input
                startIcon={SearchIcon}
                type="text"
                value={search}
                onChange={(e) => handlingSearch(e.target.value)}
                placeholder="Search list..."
                className="h-8 w-full rounded-md border border-input bg-transparent py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto p-1">
              {dataToList.length === 0 && !isLoading && (
                <p className="py-1.5 text-center text-sm">No item found.</p>
              )}
              <div>
                {dataToList.map((ls) => (
                  <div
                    key={ls.value}
                    className="min-w-0 relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      dispatch({
                        type: 'changed',
                        payload: ls.value === selectedPage.value ? '' : ls,
                      });
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        'mr-2 h-4 w-4 flex-shrink-0',
                        selectedPage.label === ls.label
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{ls.label}</span>
                  </div>
                ))}
                {hasMore && !isLoading && (
                  <div
                    ref={loaderRef}
                    className="flex items-center cursor-default px-2 py-1.5"
                  >
                    <Loader2
                      className={cn('mr-2 h-4 w-4 animate-spin opacity-50')}
                    />
                    <span className="text-sm text-muted-foreground">
                      Loading more...
                    </span>
                  </div>
                )}
                {isLoading && (
                  <div className="flex items-center cursor-default py-1.5 px-2">
                    <Loader2
                      className={cn('mr-2 h-4 w-4 opacity-50 animate-spin')}
                    />
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default SelectPageInput;
