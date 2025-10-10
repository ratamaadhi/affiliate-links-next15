'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import React, { useCallback, useRef } from 'react';

interface SearchLinksViewProps {
  onSearch: (searchTerm: string) => void;
  onInputChange: (searchTerm: string) => void;
  value: string;
  isLoading?: boolean;
  resultCount?: number;
  className?: string;
}

export function SearchLinksView({
  onSearch,
  onInputChange,
  value,
  isLoading = false,
  resultCount,
  className,
}: SearchLinksViewProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;

      // Immediately update the input value
      onInputChange(newValue);

      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounce
      debounceRef.current = setTimeout(() => {
        onSearch(newValue);
      }, 500);
    },
    [onSearch, onInputChange]
  );

  const handleClear = useCallback(() => {
    onInputChange('');
    onSearch('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, [onSearch, onInputChange]);

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground z-10" />
        <Input
          type="text"
          placeholder="Search links..."
          value={value}
          onChange={handleSearch}
          className="pl-10 pr-10 transition-all duration-200 bg-background"
          aria-label="Search links"
          data-testid="search-input"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
            data-testid="clear-search-button"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isLoading && (
          <div
            className="absolute right-10"
            role="status"
            aria-label="Loading"
            data-testid="search-spinner"
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Search status badge */}
      {value && !isLoading && (
        <div className="mt-2 flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-xs"
            data-testid="result-count-badge"
          >
            {resultCount !== undefined
              ? `${resultCount} results`
              : 'Searching...'}
          </Badge>
          {resultCount === 0 && (
            <span className="text-xs text-muted-foreground">
              No links found matching &quot;{value}&quot;
            </span>
          )}
        </div>
      )}
    </div>
  );
}
