import * as React from 'react';
import { cn } from '@/lib/utils';

interface SearchHighlightProps {
  text: string;
  searchTerm: string;
  className?: string;
}

export const SearchHighlight = React.forwardRef<
  HTMLSpanElement,
  SearchHighlightProps
>(({ text, searchTerm, className }, ref) => {
  if (!searchTerm || searchTerm.length < 2) {
    return (
      <span ref={ref} className={cn(className)}>
        {text}
      </span>
    );
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));

  return (
    <span ref={ref} className={cn(className)}>
      {parts.map((part, index) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark
            key={index}
            className="bg-primary/20 text-primary-foreground px-0.5 rounded-sm font-medium"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </span>
  );
});

SearchHighlight.displayName = 'SearchHighlight';
