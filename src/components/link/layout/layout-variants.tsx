'use client';

import React from 'react';
import { LinkSelect } from '@/lib/db/schema/link';
import { cn } from '@/lib/utils';
import { Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getLinkCategory } from '@/components/link/links-view';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Note: LinkSelect type is imported from '@/lib/db/schema/link'

// ============================================
// LINK CARD COMPONENTS
// ============================================

// Full card component (used by Masonry and Grid layouts)
export const LinkCard = ({
  link,
  handleClick,
  className,
}: {
  link: LinkSelect;
  handleClick: (_linkId: number, _url: string) => void;
  className?: string;
}) => {
  const [imageError, setImageError] = React.useState(false);

  const {
    icon: CategoryIcon,
    category,
    color,
  } = getLinkCategory(link.url, link.title);

  const formattedDate = React.useMemo(
    () => new Date(link.updatedAt).toLocaleDateString(),
    [link.updatedAt]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(link.id, link.url);
      }
    },
    [handleClick, link.id, link.url]
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="link"
          onClick={() => handleClick(link.id, link.url)}
          onKeyDown={handleKeyDown}
          className="block group break-inside-avoid mb-4 w-full text-left border-0 bg-transparent p-0 cursor-pointer"
        >
          <Card
            className={cn(
              'relative h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 hover:border-border cursor-pointer',
              className
            )}
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Large image at top - 16:9 aspect ratio, 120px height */}
            <div className="relative h-32 overflow-hidden">
              {!imageError && link.imageUrl ? (
                <img
                  src={link.imageUrl}
                  alt={link.title.replace(/\s+\d+.*$/, '').trim()}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImageError(true)}
                />
              ) : null}
              {/* Fallback gradient with category icon */}
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  !link.imageUrl || imageError ? 'flex' : 'hidden',
                  color,
                  'bg-opacity-10'
                )}
              >
                <CategoryIcon
                  className={cn('w-12 h-12', color.replace('bg-', 'text-'))}
                />
              </div>
            </div>

            {/* Content section */}
            <div className="p-4">
              {/* Category badges */}
              <div className="flex items-center gap-1 mb-2">
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {category}
                </Badge>
                {link.clickCount > 10 && (
                  <Badge
                    variant="default"
                    className="text-xs gap-0.5 px-1.5 py-0.5"
                  >
                    <TrendingUp className="w-2.5 h-2.5" />
                    Popular
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {link.title}
              </h3>

              {/* Description */}
              {link.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {link.description}
                </p>
              )}

              {/* Link metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formattedDate}</span>
                </div>
                {link.clickCount > 0 && (
                  <div className="flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span>{link.clickCount}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="space-y-1 max-w-sm">
          <p className="font-medium text-sm">{link.title}</p>
          {link.description && (
            <p className="text-xs text-muted-foreground">{link.description}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// Minimal list card (Linktree-style)
interface ListLinkCardProps {
  link: LinkSelect;
  handleClick: (_linkId: number, _url: string) => void;
}

export const ListLinkCard = ({ link, handleClick }: ListLinkCardProps) => {
  const [imageError, setImageError] = React.useState(false);

  const { icon: CategoryIcon, color } = getLinkCategory(link.url, link.title);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(link.id, link.url);
      }
    },
    [handleClick, link.id, link.url]
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Item
          asChild
          size="sm"
          variant="outline"
          className="cursor-pointer group"
          onKeyDown={handleKeyDown}
        >
          <button
            type="button"
            role="link"
            onClick={() => handleClick(link.id, link.url)}
          >
            {!imageError && link.imageUrl ? (
              <ItemMedia variant="image" className="rounded-md">
                <img
                  src={link.imageUrl}
                  alt={link.title}
                  className="size-full object-cover"
                  onError={() => setImageError(true)}
                />
              </ItemMedia>
            ) : (
              <ItemMedia
                variant="icon"
                className={cn(color, 'bg-opacity-10', 'flex')}
              >
                <CategoryIcon
                  className={cn('w-4 h-4', color.replace('bg-', 'text-'))}
                />
              </ItemMedia>
            )}
            <ItemContent>
              <ItemTitle className="line-clamp-1">{link.title}</ItemTitle>
              {link.description && (
                <ItemDescription className="line-clamp-1">
                  {link.description}
                </ItemDescription>
              )}
            </ItemContent>
          </button>
        </Item>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="space-y-1 max-w-sm">
          <p className="font-medium text-sm w-full">{link.title}</p>
          {link.description && (
            <p className="text-xs text-muted-foreground">{link.description}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// ============================================
// SKELETON LOADERS
// ============================================

// Full card skeleton (for Masonry and Grid)
export const LinkCardSkeleton = () => (
  <Card className="overflow-hidden mb-4 break-inside-avoid">
    {/* Large image skeleton */}
    <div className="h-32 bg-muted">
      <Skeleton className="w-full h-full" />
    </div>

    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      {/* Category badges */}
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>

      {/* Title */}
      <Skeleton className="h-5 w-3/4 rounded" />

      {/* Description */}
      <div className="space-y-1">
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-2/3 rounded" />
      </div>

      {/* Metadata */}
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  </Card>
);

// Minimal list skeleton (for List layout)
export const ListLinkCardSkeleton = () => (
  <Item size="sm" variant="outline">
    <ItemMedia variant="icon">
      <Skeleton className="size-4" />
    </ItemMedia>
    <ItemContent>
      <ItemTitle>
        <Skeleton className="h-4 w-3/4 rounded" />
      </ItemTitle>
      <div className="text-muted-foreground line-clamp-2 text-sm leading-normal font-normal text-balance">
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </ItemContent>
  </Item>
);

// Grid card (uniform height for GridLayout)
interface GridLinkCardProps {
  link: LinkSelect;
  handleClick: (_linkId: number, _url: string) => void;
}

export const GridLinkCard = ({ link, handleClick }: GridLinkCardProps) => {
  const [imageError, setImageError] = React.useState(false);

  const {
    icon: CategoryIcon,
    category,
    color,
  } = getLinkCategory(link.url, link.title);

  const formattedDate = React.useMemo(
    () => new Date(link.updatedAt).toLocaleDateString(),
    [link.updatedAt]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(link.id, link.url);
      }
    },
    [handleClick, link.id, link.url]
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="link"
          onClick={() => handleClick(link.id, link.url)}
          onKeyDown={handleKeyDown}
          className="block group break-inside-avoid w-full text-left border-0 bg-transparent p-0 cursor-pointer h-full"
        >
          <Card className="relative h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 hover:border-border cursor-pointer flex flex-col">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Image at top - fixed height */}
            <div className="relative h-32 overflow-hidden flex-shrink-0">
              {!imageError && link.imageUrl ? (
                <img
                  src={link.imageUrl}
                  alt={link.title.replace(/\s+\d+.*$/, '').trim()}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImageError(true)}
                />
              ) : null}
              {/* Fallback gradient with category icon */}
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  !link.imageUrl || imageError ? 'flex' : 'hidden',
                  color,
                  'bg-opacity-10'
                )}
              >
                <CategoryIcon
                  className={cn('w-12 h-12', color.replace('bg-', 'text-'))}
                />
              </div>
            </div>

            {/* Content section - fills remaining space */}
            <div className="p-4 flex flex-col flex-1 min-h-0">
              {/* Category badges */}
              <div className="flex items-center gap-1 mb-2 flex-shrink-0">
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {category}
                </Badge>
                {link.clickCount > 10 && (
                  <Badge
                    variant="default"
                    className="text-xs gap-0.5 px-1.5 py-0.5"
                  >
                    <TrendingUp className="w-2.5 h-2.5" />
                    Popular
                  </Badge>
                )}
              </div>

              {/* Title - fixed to 2 lines max */}
              <h3 className="text-base font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors flex-shrink-0">
                {link.title}
              </h3>

              {/* Description - flex to fill space, with line clamp */}
              {link.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1 min-h-0">
                  {link.description}
                </p>
              )}

              {/* Link metadata - always at bottom */}
              <div className="flex items-center justify-between text-xs text-muted-foreground flex-shrink-0 mt-auto">
                <div className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formattedDate}</span>
                </div>
                {link.clickCount > 0 && (
                  <div className="flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span>{link.clickCount}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="space-y-1 max-w-sm">
          <p className="font-medium text-sm">{link.title}</p>
          {link.description && (
            <p className="text-xs text-muted-foreground">{link.description}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// ============================================
// LAYOUT COMPONENTS
// ============================================

interface LayoutProps {
  links: LinkSelect[];
  handleClick: (_linkId: number, _url: string) => void;
}

// Masonry layout (current default)
export function MasonryLayout({ links, handleClick }: LayoutProps) {
  return (
    <div className="columns-1 sm:columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {links.map((link, index) => (
        <div
          key={link.id}
          className="break-inside-avoid animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <LinkCard link={link} handleClick={handleClick} />
        </div>
      ))}
    </div>
  );
}

// List layout (compact grid with minimal cards)
export function ListLayout({ links, handleClick }: LayoutProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {links.map((link, index) => (
        <div
          key={link.id}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <ListLinkCard link={link} handleClick={handleClick} />
        </div>
      ))}
    </div>
  );
}

// Grid layout (uniform cards with fixed aspect ratio)
export function GridLayout({ links, handleClick }: LayoutProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {links.map((link, index) => (
        <div
          key={link.id}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <GridLinkCard link={link} handleClick={handleClick} />
        </div>
      ))}
    </div>
  );
}

// ============================================
// SKELETON LAYOUTS
// ============================================

export function MasonrySkeleton() {
  return (
    <div className="columns-1 sm:columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="break-inside-avoid">
          <LinkCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index}>
          <ListLinkCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="overflow-hidden flex flex-col h-full">
          {/* Image skeleton */}
          <div className="h-32 bg-muted flex-shrink-0">
            <Skeleton className="w-full h-full" />
          </div>

          {/* Content skeleton */}
          <div className="p-4 space-y-3 flex flex-col flex-1">
            {/* Category badges */}
            <div className="flex gap-1.5 flex-shrink-0">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="h-5 w-3/4 rounded flex-shrink-0" />

            {/* Description */}
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-2/3 rounded" />
            </div>

            {/* Metadata */}
            <div className="flex justify-between flex-shrink-0">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
