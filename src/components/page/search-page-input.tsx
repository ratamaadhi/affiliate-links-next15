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
  const search = searchParams.get('_search') ?? '';
  const pageIndex = searchParams.get('_page') ?? '1';

  const [searchTerm, setSearchTerm] = useState(search ?? '');

  function setSearchParams(term: string) {
    const params = new URLSearchParams();
    if (term) {
      params.append('_search', term);
      params.append('_page', pageIndex);
    } else {
      params.delete('_search');
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const debouncedSetSearchTerm = useRef(debounce(setSearchTerm, 500)).current;

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSetSearchTerm(event.target.value);
    },
    [debouncedSetSearchTerm]
  );

  useEffect(() => {
    setSearchParams(searchTerm);
  }, [searchTerm]);

  return (
    <Input
      type="text"
      startIcon={HiOutlineSearch}
      placeholder="Search page"
      className="text-sm w-full"
      onChange={handleSearch}
      defaultValue={search}
    />
  );
}

export default SearchPageInput;
