'use client';

import { LinkSelect } from '@/lib/db/schema/link';
import { ThemeSettings } from '@/lib/page-theme';
import {
  MasonryLayout,
  ListLayout,
  GridLayout,
  MasonrySkeleton,
  ListSkeleton,
  GridSkeleton,
} from './layout/layout-variants';

// Layout component maps - defined outside component to avoid recreation on every render
const skeletonComponents = {
  masonry: MasonrySkeleton,
  list: ListSkeleton,
  grid: GridSkeleton,
} as const;

const layoutComponents = {
  masonry: MasonryLayout,
  list: ListLayout,
  grid: GridLayout,
} as const;

interface LinksContainerProps {
  links: LinkSelect[];
  themeSettings: ThemeSettings;
  handleClick: (_linkId: number, _url: string) => void;
  isLoading?: boolean;
}

export function LinksContainer({
  links,
  themeSettings,
  handleClick,
  isLoading,
}: LinksContainerProps) {
  const SkeletonComponent = skeletonComponents[themeSettings.layout];
  const LayoutComponent = layoutComponents[themeSettings.layout];

  if (isLoading) {
    return <SkeletonComponent />;
  }

  if (links.length === 0) {
    return null; // Let parent handle empty state
  }

  return <LayoutComponent links={links} handleClick={handleClick} />;
}
