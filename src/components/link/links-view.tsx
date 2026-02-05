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
import { LinksContainer } from './links-container';
import { parseThemeSettings, DEFAULT_THEME_SETTINGS } from '@/lib/page-theme';
import {
  MasonrySkeleton,
  ListSkeleton,
  GridSkeleton,
} from './layout/layout-variants';

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
export const getLinkCategory = (url: string, title: string) => {
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

// Partial loading skeleton for links only
const PartialLinksSkeleton = ({
  themeSettings,
}: {
  themeSettings: typeof DEFAULT_THEME_SETTINGS;
}) => {
  const SkeletonComponent = {
    masonry: MasonrySkeleton,
    list: ListSkeleton,
    grid: GridSkeleton,
  }[themeSettings.layout];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <SkeletonComponent />
    </div>
  );
};

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

  // Parse theme settings
  const themeSettings = React.useMemo(() => {
    return parseThemeSettings(pageData?.themeSettings);
  }, [pageData?.themeSettings]);

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
    const SkeletonComponent = {
      masonry: MasonrySkeleton,
      list: ListSkeleton,
      grid: GridSkeleton,
    }[themeSettings.layout];

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

        {/* Links skeleton - uses theme-based layout */}
        <SkeletonComponent />
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
          <PartialLinksSkeleton themeSettings={themeSettings} />
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

            {/* Links container - uses theme-based layout */}
            <LinksContainer
              links={links}
              themeSettings={themeSettings}
              handleClick={handleClick}
              isLoading={false}
            />
            {!isReachingEnd && !isLoadingMore && (
              <div ref={loaderRef}>
                <LinksContainer
                  links={[]}
                  themeSettings={themeSettings}
                  handleClick={handleClick}
                  isLoading={true}
                />
              </div>
            )}
            {isLoadingMore && (
              <LinksContainer
                links={[]}
                themeSettings={themeSettings}
                handleClick={handleClick}
                isLoading={true}
              />
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
