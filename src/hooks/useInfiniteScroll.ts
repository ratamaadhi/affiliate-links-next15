'use client';

import { useEffect } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

function useInfiniteScroll(
  hasMore: boolean,
  onLoadMore: () => void,
  isLoading: boolean
): (node?: Element | null) => void {
  const { isIntersecting, ref: loaderRef } = useIntersectionObserver({
    threshold: 0.5,
  });

  useEffect(() => {
    if (!loaderRef) return;

    const canLoadMore = isIntersecting && hasMore && !isLoading;

    if (canLoadMore) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, isIntersecting, isLoading, loaderRef]);

  return loaderRef;
}

export default useInfiniteScroll;
