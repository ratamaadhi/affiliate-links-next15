'use client';

import { debounce } from 'lodash';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import { Input } from '../ui/input';

function SearchPageInput() {
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

  const debouncedSetSearchTerm = useRef(debounce(setSearchParams, 500)).current;

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const term = event.target.value;
      setSearchTerm(term);
      debouncedSetSearchTerm(term);
    },
    [debouncedSetSearchTerm]
  );

  useEffect(() => {
    const searchParam = searchParams.get('_search');
    if (searchParam !== searchTerm) {
      setSearchTerm(searchParam || '');
    }
  }, [searchParams]);

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
