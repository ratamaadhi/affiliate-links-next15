'use client';

import {
  LinkPageContext,
  LinkPageDispatchContext,
} from '@/context/link-page-context';
import { useAuth } from '@/hooks/useAuth';
import { debounce } from 'lodash';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';

function SearchLinkInput() {
  const { user } = useAuth();

  const { selectedPage } = useContext(LinkPageContext);
  const dispatch = useContext(LinkPageDispatchContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');

  const debouncedSetSearchTerm = useRef(debounce(setSearchTerm, 500)).current;

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSetSearchTerm(event.target.value);
      setSearch(event.target.value);
    },
    [debouncedSetSearchTerm, setSearch]
  );

  useEffect(() => {
    dispatch({
      type: 'search-link',
      payload: searchTerm,
    });
  }, [searchTerm]);

  if ((!user || !user.username) && !selectedPage?.id) {
    return <Skeleton className="h-9 w-full rounded-lg" />;
  }

  return (
    <Input
      type="text"
      startIcon={HiOutlineSearch}
      placeholder="Search Link"
      className="text-sm w-full"
      onChange={handleSearch}
      value={search}
      data-search-input
    />
  );
}

export default SearchLinkInput;
