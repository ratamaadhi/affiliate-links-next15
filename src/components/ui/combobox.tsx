'use client';

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PageSelect } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import LoadingIndicator from '../loading-indicator';

interface ListType extends PageSelect {
  value: string;
  label: string;
}

export function Combobox({
  list,
  setSearch,
  loaderRef,
  hasMore = false,
}: {
  list: ListType[];
  setSearch: any;
  loaderRef?: any;
  hasMore?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? list.find((ls) => ls.value === value)?.label
            : 'Select list...'}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            onValueChange={(value) => setSearch(value)}
            placeholder="Search lsit..."
          />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {list &&
                list.length > 0 &&
                list.map((ls) => (
                  <CommandItem
                    key={ls.value}
                    value={ls.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === ls.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {ls.label}
                  </CommandItem>
                ))}
              <CommandItem>
                <CheckIcon className={cn('mr-2 h-4 w-4 opacity-0')} />
                <LoadingIndicator hasMore={hasMore} loaderRef={loaderRef} />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
