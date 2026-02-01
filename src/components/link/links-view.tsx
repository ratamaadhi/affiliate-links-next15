'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ErrorState } from '@/components/ui/loading-states';
import { Skeleton } from '@/components/ui/skeleton';
import { useLinkForPageInfinite } from '@/hooks/queries';
import { useLinkClick } from '@/hooks/use-link-click';
import { useDebounce } from '@/hooks/useDebounce';
import { page } from '@/lib/db/schema';
import type { LinkSelect } from '@/lib/db/schema/link';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Clock,
  Gamepad2,
  Globe,
  LinkIcon,
  Music,
  ShoppingBag,
  Star,
  TrendingUp,
  Video,
} from 'lucide-react';
import { SearchLinksView } from './search-links-view';
import { FloatingPageMenu } from './floating-page-menu';

import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

// Link category detection and icon mapping
const getLinkCategory = (url: string, title: string) => {
  try {
    const domain = new URL(url).hostname.toLowerCase();

    if (domain.includes('youtube') || domain.includes('youtu.be'))
      return { icon: Video, category: 'Video', color: 'bg-red-500' };
    if (
      domain.includes('amazon') ||
      domain.includes('shop') ||
      title.toLowerCase().includes('shop')
    )
      return {
        icon: ShoppingBag,
        category: 'Shopping',
        color: 'bg-orange-500',
      };
    if (
      domain.includes('spotify') ||
      domain.includes('music') ||
      title.toLowerCase().includes('music')
    )
      return { icon: Music, category: 'Music', color: 'bg-green-500' };
    if (
      domain.includes('github') ||
      domain.includes('code') ||
      title.toLowerCase().includes('code')
    )
      return { icon: BookOpen, category: 'Code', color: 'bg-blue-500' };
    if (
      domain.includes('steam') ||
      domain.includes('game') ||
      title.toLowerCase().includes('game')
    )
      return { icon: Gamepad2, category: 'Gaming', color: 'bg-purple-500' };
  } catch {
    // Invalid URL, fallback to default
  }

  return { icon: Globe, category: 'Website', color: 'bg-gray-500' };
};

// Enhanced link card component
const LinkCard = ({
  link,
  handleClick,
  ...props
}: {
  link: LinkSelect;
  handleClick: (_linkId: number, _url: string) => void;
  [key: string]: any;
}) => {
  const {
    icon: CategoryIcon,
    category,
    color,
  } = getLinkCategory(link.url, link.title);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(link.id, link.url);
    }
  };

  return (
    <button
      type="button"
      role="link"
      onClick={() => handleClick(link.id, link.url)}
      onKeyDown={handleKeyDown}
      className="block group break-inside-avoid mb-4 w-full text-left border-0 bg-transparent p-0 cursor-pointer"
      {...props}
    >
      <Card className="relative h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 hover:border-border cursor-pointer">
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Large image at top - 16:9 aspect ratio, 120px height */}
        <div className="relative h-32 overflow-hidden">
          {link.imageUrl ? (
            <img
              src={link.imageUrl}
              alt={link.title.replace(/\s+\d+.*$/, '').trim()}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget
                  .nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          {/* Fallback gradient with category icon */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              link.imageUrl ? 'hidden' : 'flex',
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
              <span>{new Date(link.updatedAt).toLocaleDateString()}</span>
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
  );
};

// Enhanced skeleton loader - compact (keep original for backward compatibility)
const LinkCardSkeleton = () => (
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

// Partial loading skeleton for links only
const PartialLinksSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32 rounded" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="columns-1 sm:columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="break-inside-avoid">
          <LinkCardSkeleton />
        </div>
      ))}
    </div>
  </div>
);

export function LinksView({
  pageData,
  username,
  currentSlug,
}: {
  pageData: typeof page.$inferSelect | null;
  username?: string;
  currentSlug?: string;
}) {
  // Hook for click tracking
  const { handleClick } = useLinkClick();

  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Hook for data with search parameter
  const { data, isLoading, error, mutate, size, setSize } =
    useLinkForPageInfinite({
      pageId: pageData?.id || null,
      search: debouncedSearchTerm,
      limit: 8,
    });

  // Handler for search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Handler for input change (immediate update)
  const handleInputChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Reset loading state when data is loaded and track initial load
  useEffect(() => {
    if (!isLoading) {
      // Mark initial load as complete after first successful load
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [isLoading, isInitialLoad]);

  // Calculate search result count with memoization
  const searchResultCount = React.useMemo(() => {
    return debouncedSearchTerm
      ? data?.flatMap((page) => page?.data?.data || []).length || 0
      : undefined;
  }, [data, debouncedSearchTerm]);

  // Process and deduplicate links with memoization
  const links = React.useMemo(() => {
    const allLinks = data ? data.flatMap((page) => page?.data?.data || []) : [];
    const uniqueLinks = [];
    const seenIds = new Set();
    for (const link of allLinks) {
      if (link.id && !seenIds.has(link.id)) {
        seenIds.add(link.id);
        uniqueLinks.push(link);
      }
    }
    return uniqueLinks;
  }, [data]);

  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isEmpty = data?.[0]?.data.data.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.data.data.length < 5);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isLoadingMore, isReachingEnd, size, setSize]);

  const loaderRef = useInfiniteScroll(!isReachingEnd, loadMore, isLoadingMore);

  // Initial load - show full page skeleton
  if (isInitialLoad) {
    return (
      <div className="space-y-8">
        {/* Page header skeleton */}
        <Card className="overflow-hidden">
          <CardHeader className="text-center pb-6">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-8 w-48 mx-auto rounded" />
                <Skeleton className="h-4 w-64 mx-auto rounded" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Links grid skeleton - masonry */}
        <div className="columns-1 sm:columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="break-inside-avoid">
              <LinkCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <LinkIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
            <CardDescription>
              The page you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Enhanced page header */}
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="relative text-center pb-8">
            <div className="flex flex-col items-center gap-4">
              {/* Avatar */}
              <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {pageData.title?.charAt(0)?.toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>

              {/* Title and description */}
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {pageData.title}
                </CardTitle>
                {pageData.description && (
                  <CardDescription className="text-lg max-w-2xl mx-auto leading-relaxed">
                    {pageData.description}
                  </CardDescription>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  <span>
                    {data &&
                    data[0]?.data?.pagination &&
                    'totalItems' in data[0].data.pagination
                      ? `${(data[0].data.pagination as { totalItems: number }).totalItems} Links`
                      : '0 Links'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Active</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        {/* Search component */}
        <SearchLinksView
          onSearch={handleSearch}
          onInputChange={handleInputChange}
          value={searchTerm}
          isLoading={isLoading}
          resultCount={searchResultCount}
          className="mb-6"
        />
        {/* Links section */}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <ErrorState
                title="Failed to load links"
                description="There was an error loading the links. Please try again."
                onRetry={() => mutate()}
              />
            </CardContent>
          </Card>
        )}
        {isInitialLoad && (
          // Search loading - show only links skeleton
          <PartialLinksSkeleton />
        )}
        {links.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {debouncedSearchTerm ? 'Search Results' : 'Featured Links'}
              </h2>
              <Badge variant="outline" className="gap-1">
                <Star className="w-3 h-3" />
                {links.length} Available
              </Badge>
            </div>

            {/* Masonry grid layout for desktop */}
            <div
              className="columns-1 sm:columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
              data-testid="links-container"
            >
              {links.map((link, index) => (
                <div
                  key={link.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <LinkCard
                    link={link}
                    handleClick={handleClick}
                    data-testid="link-card"
                  />
                </div>
              ))}
            </div>
            {!isReachingEnd && !isLoadingMore && (
              <div
                ref={loaderRef}
                className="columns-1 sm:columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
                data-testid="links-container-skeleton"
              >
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="break-inside-avoid">
                    <LinkCardSkeleton />
                  </div>
                ))}
              </div>
            )}
            {isLoadingMore && (
              <div
                className="columns-1 sm:columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
                data-testid="links-container-skeleton"
              >
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="break-inside-avoid">
                    <LinkCardSkeleton />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {links.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <LinkIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {debouncedSearchTerm
                      ? 'No Results Found'
                      : 'No Links Available'}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {debouncedSearchTerm
                      ? `No links found matching "${debouncedSearchTerm}". Try different keywords.`
                      : `This page doesn't have any active links yet. Check back later for updates!`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Page Menu */}
      {username && (
        <FloatingPageMenu username={username} currentSlug={currentSlug} />
      )}
    </ErrorBoundary>
  );
}
