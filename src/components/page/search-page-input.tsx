'use client';

import { debounce } from 'lodash';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import { Input } from '../ui/input';

interface SearchPageInputProps {
  onSearch?: (_term: string) => void;
  useUrl?: boolean;
}

function SearchPageInput({ onSearch, useUrl = true }: SearchPageInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');

  const setSearchParams = useCallback(
    (term: string) => {
      const params = new URLSearchParams();
      if (term) {
        params.append('_search', term);
        params.append('_page', '1');
      } else {
        params.delete('_search');
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router]
  );

  const debouncedSetSearchParams = useMemo(
    () => debounce(setSearchParams, 500),
    [setSearchParams]
  );

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const term = event.target.value;
      setSearchTerm(term);

      if (useUrl) {
        debouncedSetSearchParams(term);
      }

      if (onSearch) {
        onSearch(term);
      }
    },
    [debouncedSetSearchParams, onSearch, useUrl]
  );

  useEffect(() => {
    if (!useUrl) return;

    const searchParam = searchParams.get('_search');
    if (searchParam !== searchTerm) {
      setSearchTerm(searchParam || '');
    }
  }, [searchParams, useUrl]);

  return (
    <Input
      type="text"
      startIcon={HiOutlineSearch}
      placeholder="Search page"
      className="text-sm w-full"
      onChange={handleSearch}
      value={searchTerm}
      data-search-page-input
    />
  );
}

export default SearchPageInput;
