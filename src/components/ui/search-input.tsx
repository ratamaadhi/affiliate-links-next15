import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2, Search, X } from 'lucide-react';
import * as React from 'react';

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
  debounceMs?: number;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      isLoading = false,
      placeholder = 'Search...',
      className,
      showClearButton = true,
      debounceMs = 500,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState(value);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    };

    const handleClear = () => {
      setLocalValue('');
      onChange('');
      onClear?.();
    };

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const hasValue = localValue.length > 0;

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          startIcon={Search}
          className={cn('pr-20', className)}
          // disabled={isLoading}
          aria-label="Search pages"
          aria-describedby={hasValue ? 'search-clear-button' : undefined}
          {...props}
        />

        {(hasValue || isLoading) && (
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2
                size={16}
                className="text-muted-foreground mr-1 animate-spin"
                aria-hidden="true"
              />
            )}
            {hasValue && showClearButton && !isLoading && (
              <Button
                id="search-clear-button"
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 w-7 p-0 hover:bg-muted"
                aria-label="Clear search"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
