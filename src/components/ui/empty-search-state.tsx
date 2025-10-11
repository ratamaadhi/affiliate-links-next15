import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptySearchStateProps {
  searchTerm: string;
  className?: string;
}

export const EmptySearchState = React.forwardRef<
  HTMLDivElement,
  EmptySearchStateProps
>(({ searchTerm, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('text-center py-8 px-4', className)}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No results found</h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        No pages match &quot;{searchTerm}&quot;. Try different keywords or check
        spelling.
      </p>
    </div>
  );
});

EmptySearchState.displayName = 'EmptySearchState';
