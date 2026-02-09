'use client';

import React from 'react';
import { LinkSelect } from '@/lib/db/schema/link';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, TrendingUp, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getLinkCategory } from '@/components/link/links-view';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportLinkDialog } from '@/components/link/report-link-dialog';
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

// Extended type for links with position calculated from server
export type LinkWithPosition = LinkSelect & { position: number };

// ============================================
// LINK CARD COMPONENTS
// ============================================

// Full card component (used by Masonry and Grid layouts)
export const LinkCard = ({
  link,
  handleClick,
  className,
}: {
  link: LinkWithPosition;
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
    <div className="w-full h-full relative">
      {/* Three-dot menu - z-30 to be above overlay, pointer-events-auto to receive clicks */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 hover:bg-background"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ReportLinkDialog
              linkId={link.id}
              linkTitle={link.title}
              trigger={
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report Issue
                </button>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Tooltip disableHoverableContent>
        <TooltipTrigger asChild>
          <button
            role="link"
            onClick={() => handleClick(link.id, link.url)}
            onKeyDown={handleKeyDown}
            className="block group break-inside-avoid mb-4 w-full text-left border-0 bg-transparent p-0 cursor-pointer"
            data-testid="link-card"
          >
            <Card
              className={cn(
                'relative h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 hover:border-border',
                className
              )}
            >
              {/* Animated gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Large image at top - 16:9 aspect ratio, 120px height */}
              <div className="relative h-32 overflow-hidden pointer-events-none">
                {/* Order number badge - positioned over image */}
                <div className="absolute top-3 left-3 rounded-full w-7 h-7 flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold shadow-md">
                  {link.position ?? '-'}
                </div>
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
              <div className="p-4 pointer-events-none">
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
              <p className="text-xs text-muted-foreground">
                {link.description}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

// Minimal list card (Linktree-style)
interface ListLinkCardProps {
  link: LinkWithPosition;
  handleClick: (_linkId: number, _url: string) => void;
}

export const ListLinkCard = ({ link, handleClick }: ListLinkCardProps) => {
  const [imageError, setImageError] = React.useState(false);

  const { icon: CategoryIcon, color } = getLinkCategory(link.url, link.title);

  return (
    <Item
      size="sm"
      variant="outline"
      className="cursor-pointer group w-full h-full px-3 py-2.5 bg-background relative min-h-[66.25px]"
    >
      <div className="absolute top-1/2 -translate-y-1/2 left-2 z-10">
        <div
          className="relative pl-1"
          onClick={() => handleClick(link.id, link.url)}
        >
          <div className="absolute -left-1 -top-1.5 z-30 rounded-full w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-semibold shadow-md border-2 border-background">
            {link.position ?? '-'}
          </div>
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
              className={cn(color, 'bg-opacity-10', 'flex size-10')}
            >
              <CategoryIcon
                className={cn('w-4 h-4', color.replace('bg-', 'text-'))}
              />
            </ItemMedia>
          )}
        </div>
      </div>
      <Tooltip disableHoverableContent>
        <TooltipTrigger asChild>
          <ItemContent
            className="pl-12 pr-7 z-20"
            onClick={() => handleClick(link.id, link.url)}
          >
            <ItemTitle className="line-clamp-1 w-full text-center">
              {link.title}
            </ItemTitle>
            {link.description && (
              <ItemDescription className="line-clamp-1 text-center">
                {link.description}
              </ItemDescription>
            )}
          </ItemContent>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="space-y-1 max-w-sm">
            <p className="font-medium text-sm w-full">{link.title}</p>
            {link.description && (
              <p className="text-xs text-muted-foreground">
                {link.description}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 bg-background/80 hover:bg-background absolute right-2 top-1/2 -translate-y-1/2 z-30"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ReportLinkDialog
            linkId={link.id}
            linkTitle={link.title}
            trigger={
              <button
                type="button"
                className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report Issue
              </button>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </Item>
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
  link: LinkWithPosition;
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
    <div className="w-full h-full relative">
      {/* Three-dot menu - z-30 to be above overlay, pointer-events-auto to receive clicks */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 hover:bg-background"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ReportLinkDialog
              linkId={link.id}
              linkTitle={link.title}
              trigger={
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report Issue
                </button>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Tooltip disableHoverableContent>
        <TooltipTrigger asChild>
          <button
            className="block group break-inside-avoid w-full text-left relative h-full cursor-pointer"
            onClick={() => handleClick(link.id, link.url)}
            onKeyDown={handleKeyDown}
            data-testid="link-card"
            role="link"
          >
            <Card className="relative h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 hover:border-border flex flex-col">
              {/* Animated gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Image at top - fixed height */}
              <div className="relative h-32 overflow-hidden flex-shrink-0 pointer-events-none">
                {/* Order number badge - positioned over image with z-index to stay above scaled image */}
                <div className="absolute top-3 left-3 z-10 rounded-full w-7 h-7 flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold shadow-md">
                  {link.position ?? '-'}
                </div>
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
              <div className="p-4 flex flex-col flex-1 min-h-0 pointer-events-none">
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
              <p className="text-xs text-muted-foreground">
                {link.description}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

// ============================================
// LAYOUT COMPONENTS
// ============================================

interface LayoutProps {
  links: LinkWithPosition[];
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
